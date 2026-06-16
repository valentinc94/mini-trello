/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Task, TaskStatus, Project, User } from "@/types/models";
import { TaskService } from "@/services/task.service";
import { ProjectService } from "@/services/project.service";
import { TaskDetailModal } from "./TaskDetailModal";
import { Toast } from "@/components/ui/Toast";

interface KanbanBoardProps {
  project: Project;
  user: User;
  initialTasks: Task[];
}

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: "to_do", title: "To Do" },
  { id: "in_progress", title: "In Progress" },
  { id: "done", title: "Done" },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ project, user, initialTasks }) => {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [creatingForColumn, setCreatingForColumn] = useState<TaskStatus | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [filterUserId, setFilterUserId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<{msg: string, type: 'success'|'error'} | null>(null);

  // Project Settings State
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [showDeleteProjectConfirm, setShowDeleteProjectConfirm] = useState(false);
  const [projectName, setProjectName] = useState(project.name);
  const [projectDescription, setProjectDescription] = useState(project.description);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  const showError = (msg: string) => setToastMessage({ msg, type: 'error' });
  const showSuccess = (msg: string) => setToastMessage({ msg, type: 'success' });

  // Derive unique team members from tasks
  const teamMembers = Array.from(new Map(
    tasks.filter(t => t.assigned_to).map(t => [t.assigned_to!.id, t.assigned_to!])
  ).values());

  const displayedTasks = tasks.filter(t => 
    filterUserId ? t.assigned_to?.id === filterUserId : true
  );

  const handleCreateTask = async (e: React.FormEvent, status: TaskStatus) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      setCreatingForColumn(null);
      return;
    }
    
    try {
      const created = await TaskService.createTask(project.id, { 
        title: newTaskTitle, 
        status: status 
      });
      setTasks(prev => [...prev, created]);
      showSuccess("Task created successfully");
    } catch (err: any) {
      showError(err.message || "Failed to create task");
    } finally {
      setNewTaskTitle("");
      setCreatingForColumn(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => {
      const el = document.getElementById(`task-${taskId}`);
      if (el) el.style.opacity = "0.5";
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent, taskId: number) => {
    setDraggedTaskId(null);
    const el = document.getElementById(`task-${taskId}`);
    if (el) el.style.opacity = "1";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    if (draggedTaskId === null) return;

    const taskToMove = tasks.find((t) => t.id === draggedTaskId);
    if (!taskToMove || taskToMove.status === targetStatus) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === draggedTaskId ? { ...t, status: targetStatus } : t))
    );

    try {
      await TaskService.updateTaskStatus(draggedTaskId, targetStatus);
    } catch (err: any) {
      setTasks((prev) =>
        prev.map((t) => (t.id === draggedTaskId ? { ...t, status: taskToMove.status } : t))
      );
      showError(err.message || "Failed to update task status");
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    setIsSavingProject(true);
    try {
      await ProjectService.updateProject(project.id, projectName, projectDescription);
      showSuccess("Project details updated");
      setIsEditingProject(false);
      router.refresh();
    } catch (err: any) {
      showError(err.message || "Failed to update project");
    } finally {
      setIsSavingProject(false);
    }
  };

  const handleDeleteProject = async () => {
    setIsDeletingProject(true);
    try {
      await ProjectService.deleteProject(project.id);
      showSuccess("Project deleted");
      setShowDeleteProjectConfirm(false);
      router.push("/");
      router.refresh();
    } catch (err: any) {
      showError(err.message || "Failed to delete project");
      setIsDeletingProject(false);
    }
  };

  const isOwner = project.owner.id === user.id;

  return (
    <div className="flex flex-col h-full">
      {/* Project Meta header (Description, Edit/Delete settings) */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 pb-6 border-b border-slate-100 px-2">
        <p className="text-slate-500 text-xs font-medium max-w-2xl leading-relaxed">
          {project.description || "No description provided."}
        </p>
        
        {isOwner && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setProjectName(project.name);
                setProjectDescription(project.description);
                setIsEditingProject(true);
              }}
              className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 active:scale-95 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Edit Board
            </button>
            <button
              onClick={() => setShowDeleteProjectConfirm(true)}
              className="px-3.5 py-2 border border-red-100 hover:bg-red-50 text-red-600 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 active:scale-95 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Board
            </button>
          </div>
        )}
      </div>

      {/* Board Header / Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6 px-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Filter by member:</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterUserId(null)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterUserId === null 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              All Members
            </button>
            {teamMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => setFilterUserId(filterUserId === member.id ? null : member.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  filterUserId === member.id 
                    ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300 ring-offset-1' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${filterUserId === member.id ? 'bg-white/20' : 'bg-blue-100 text-blue-700'}`}>
                  {member.username.charAt(0).toUpperCase()}
                </div>
                {member.username}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-4 sm:gap-6 h-full items-start overflow-x-auto pb-8 px-2 w-full snap-x snap-mandatory touch-pan-x">
        {COLUMNS.map((column) => (
        <div
          key={column.id}
          className="flex-shrink-0 w-[280px] sm:w-[340px] bg-slate-100/50 rounded-2xl p-3 sm:p-3.5 flex flex-col max-h-[85vh] snap-center"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          <div className="flex justify-between items-center mb-3 px-1">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2">
              {column.title}
              <span className="text-slate-400 text-xs font-medium">
                {displayedTasks.filter((t) => t.status === column.id).length}
              </span>
            </h3>
          </div>

          <div className="flex-1 flex flex-col gap-3 overflow-y-auto px-1 pb-2 custom-scrollbar">
            {displayedTasks
              .filter((t) => t.status === column.id)
              .map((task) => (
                <div
                  key={task.id}
                  id={`task-${task.id}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragEnd={(e) => handleDragEnd(e, task.id)}
                  onClick={() => setSelectedTask(task)}
                  className="bg-white p-4 rounded-xl border border-slate-200/80 cursor-grab active:cursor-grabbing hover:shadow-sm hover:border-blue-200 transition-all group relative flex flex-col gap-2"
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2">{task.title}</h4>
                  </div>
                  
                  {task.description && (
                    <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                      {task.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          task.priority === "urgent"
                            ? "bg-red-50 text-red-600 border border-red-100"
                            : task.priority === "high"
                            ? "bg-orange-50 text-orange-600 border border-orange-100"
                            : task.priority === "medium"
                            ? "bg-blue-50 text-blue-600 border border-blue-100"
                            : "bg-slate-50 text-slate-500 border border-slate-100"
                        }`}
                      >
                        {task.priority}
                      </span>
                      
                      {task.due_date && (
                        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                      )}
                    </div>
                    
                    {task.assigned_to && (
                      <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[9px] font-bold text-blue-600" title={task.assigned_to.username}>
                        {task.assigned_to.username.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            
            {displayedTasks.filter((t) => t.status === column.id).length === 0 && (
              <div className="border border-dashed border-slate-200 rounded-xl h-20 flex items-center justify-center text-slate-400 text-xs font-semibold">
                No tasks yet
              </div>
            )}
            
            {creatingForColumn === column.id ? (
              <form onSubmit={(e) => handleCreateTask(e, column.id)} className="mt-2 bg-white p-3 rounded-xl border border-blue-300 shadow-sm">
                <textarea
                  autoFocus
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Task title..."
                  className="w-full text-sm resize-none focus:outline-none border-none text-slate-900 mb-2 p-0"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleCreateTask(e, column.id);
                    }
                  }}
                />
                <div className="flex items-center gap-1.5">
                  <button type="submit" onMouseDown={(e) => e.preventDefault()} className="px-3.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">Add</button>
                  <button type="button" onClick={() => setCreatingForColumn(null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </form>
            ) : (
              <button 
                onClick={() => {
                  setCreatingForColumn(column.id);
                  setNewTaskTitle("");
                }}
                className="mt-1 flex items-center gap-2 w-full px-2 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200/40 hover:text-slate-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                New Task
              </button>
            )}
          </div>
        </div>
      ))}
      </div>

      {/* Edit Project Modal */}
      {isEditingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-[450px] bg-white rounded-[24px] p-8 border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">Edit Board Settings</h3>
              <button onClick={() => setIsEditingProject(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleUpdateProject} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Board Name</label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 text-slate-900 text-sm rounded-xl px-4 py-3 outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Description</label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200/80 text-slate-900 text-sm rounded-xl px-4 py-3 outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 font-medium resize-none"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProject(false)}
                  className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm py-2.5 rounded-xl transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProject}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(37,99,235,0.1)] active:scale-95 disabled:opacity-75 flex items-center justify-center"
                >
                  {isSavingProject ? (
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Project Confirmation Modal */}
      {showDeleteProjectConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-[400px] bg-white rounded-[24px] p-8 border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1.5">Delete Board</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">Are you sure you want to delete this board? This action will permanently delete the project and all associated tasks. This cannot be undone.</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isDeletingProject}
                onClick={() => setShowDeleteProjectConfirm(false)}
                className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm py-2.5 rounded-xl transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingProject}
                onClick={handleDeleteProject}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm py-2.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(220,38,38,0.1)] active:scale-95 disabled:opacity-75 flex items-center justify-center"
              >
                {isDeletingProject ? (
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTask && (
        <TaskDetailModal 
          task={selectedTask} 
          onClose={() => setSelectedTask(null)} 
          onTaskUpdated={(updatedTask) => {
            setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
            setSelectedTask(updatedTask);
          }}
          onTaskDeleted={(taskId) => {
            setTasks(prev => prev.filter(t => t.id !== taskId));
            setSelectedTask(null);
            showSuccess("Task deleted");
          }}
          onError={showError}
          onSuccess={showSuccess}
        />
      )}

      {toastMessage && (
        <Toast 
          message={toastMessage.msg} 
          type={toastMessage.type} 
          onClose={() => setToastMessage(null)} 
        />
      )}
    </div>
  );
};
