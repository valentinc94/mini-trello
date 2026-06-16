/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { Task } from "@/types/models";
import { TaskService } from "@/services/task.service";

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  onTaskUpdated: (updatedTask: Task) => void;
  onTaskDeleted: (taskId: number) => void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

const getFieldFriendlyName = (field: string) => {
  switch (field) {
    case 'due_date': return 'due date';
    case 'assigned_to_id': return 'assignee';
    default: return field;
  }
};

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ 
  task, 
  onClose,
  onTaskUpdated,
  onTaskDeleted,
  onError,
  onSuccess
}) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState(task.priority);
  const [status, setStatus] = useState(task.status);
  const [assignedToId, setAssignedToId] = useState<number | "">(task.assigned_to?.id || "");
  const [dueDate, setDueDate] = useState(task.due_date || "");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Custom Dropdown Open States
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);

  const handleAutoSave = async (field: string, value: any) => {
    // Prevent redundant saves
    if (value === (task as any)[field] || (field === 'assigned_to_id' && value === (task.assigned_to?.id || ""))) {
      return;
    }

    try {
      const payload: any = {};
      if (field === 'assigned_to_id') {
        payload.assigned_to_id = value === "" ? null : Number(value);
      } else {
        payload[field] = value;
      }
      
      const updated = await TaskService.updateTask(task.id, payload);
      onTaskUpdated(updated);
      onSuccess(`Task ${getFieldFriendlyName(field)} updated`);
    } catch (e: any) {
      onError(e.message || `Failed to update ${getFieldFriendlyName(field)}`);
      // Revert local state on failure
      if (field === 'title') setTitle(task.title);
      if (field === 'description') setDescription(task.description || "");
      if (field === 'priority') setPriority(task.priority);
      if (field === 'status') setStatus(task.status);
      if (field === 'assigned_to_id') setAssignedToId(task.assigned_to?.id || "");
      if (field === 'due_date') setDueDate(task.due_date || "");
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await TaskService.deleteTask(task.id);
      onTaskDeleted(task.id);
      setShowDeleteConfirm(false);
    } catch (e: any) {
      onError(e.message || "Failed to delete task");
      setIsDeleting(false);
    }
  };

  // Helper for Status Badge styling
  const getStatusDisplay = (s: string) => {
    switch (s) {
      case "to_do":
        return { label: "To Do", bg: "bg-blue-50/80 text-blue-600 border border-blue-100", dot: "bg-blue-500" };
      case "in_progress":
        return { label: "In Progress", bg: "bg-amber-50/80 text-amber-600 border border-amber-100", dot: "bg-amber-500" };
      case "done":
        return { label: "Done", bg: "bg-emerald-50/80 text-emerald-600 border border-emerald-100", dot: "bg-emerald-500" };
      default:
        return { label: s, bg: "bg-slate-50 text-slate-600 border border-slate-100", dot: "bg-slate-500" };
    }
  };

  // Helper for Priority styling
  const getPriorityDisplay = (p: string) => {
    switch (p) {
      case "urgent":
        return { label: "Urgent", bg: "bg-red-50 text-red-600 border border-red-100", dot: "bg-red-500" };
      case "high":
        return { label: "High", bg: "bg-orange-50 text-orange-600 border border-orange-100", dot: "bg-orange-500" };
      case "medium":
        return { label: "Medium", bg: "bg-blue-50 text-blue-600 border border-blue-100", dot: "bg-blue-500" };
      case "low":
        default:
        return { label: "Low", bg: "bg-slate-50 text-slate-600 border border-slate-200/60", dot: "bg-slate-400" };
    }
  };

  // Helper for Assignee initials
  const getAssigneeDisplay = (id: number | "") => {
    if (id === 1) return { name: "Demo Reviewer", short: "DR", email: "demo@smartnsales.com" };
    if (id === 2) return { name: "Jane Manager", short: "JM", email: "jane@smartnsales.com" };
    return { name: "Unassigned", short: "?", email: "" };
  };

  const currentStatusInfo = getStatusDisplay(status);
  const currentPriorityInfo = getPriorityDisplay(priority);
  const currentAssigneeInfo = getAssigneeDisplay(assignedToId);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
        <div 
          className="bg-white rounded-t-[24px] sm:rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] w-full max-w-5xl h-[92vh] sm:h-[80vh] flex flex-col border border-slate-100 animate-in zoom-in-95 duration-200"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-4">
              <span className="text-slate-500 font-mono text-sm font-semibold flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002-2h2a2 2 0 012 2" />
                </svg>
                TASK-{task.id}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all flex items-center gap-2 active:scale-95"
                title="Delete Task"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
              <button 
                onClick={onClose} 
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Main Content Area - 2 Columns */}
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
            {/* Left Column - Main Content */}
            <div className="flex-1 p-4 sm:p-8 overflow-y-auto">
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)}
                onBlur={e => handleAutoSave('title', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                className="w-full text-2xl font-bold text-slate-900 border border-transparent hover:border-slate-200/80 focus:border-blue-500 rounded-xl px-3 py-2 mb-6 outline-none transition-all focus:bg-white bg-transparent"
                placeholder="Task title"
              />
              
              <div className="mb-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  Description
                </h3>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)}
                  onBlur={e => handleAutoSave('description', e.target.value)}
                  rows={10}
                  className="w-full text-sm text-slate-700 border border-transparent hover:border-slate-200/80 focus:border-blue-500 rounded-xl px-4 py-3 outline-none transition-all focus:bg-white bg-slate-50 hover:bg-slate-100/50 resize-none leading-relaxed"
                  placeholder="Add a more detailed description..."
                />
              </div>
            </div>

            {/* Right Column - Metadata */}
            <div className="w-full md:w-80 bg-slate-50/50 border-t md:border-t-0 md:border-l border-slate-100 p-4 sm:p-6 overflow-y-auto flex flex-col gap-5 shrink-0">
              
              {/* STATUS SELECT */}
              <div className="space-y-1.5 relative">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Status</label>
                <button
                  type="button"
                  onClick={() => setIsStatusOpen(!isStatusOpen)}
                  className="w-full bg-white hover:bg-slate-50/80 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-700 outline-none flex items-center justify-between transition-all active:scale-[0.99]"
                >
                  <span className={`flex items-center gap-2 px-2.5 py-1 text-xs font-bold rounded-full ${currentStatusInfo.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${currentStatusInfo.dot}`} />
                    {currentStatusInfo.label.toUpperCase()}
                  </span>
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isStatusOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsStatusOpen(false)} />
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200/80 rounded-2xl shadow-xl z-50 p-1.5 flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                      {[
                        { val: "to_do", key: "To Do" },
                        { val: "in_progress", key: "In Progress" },
                        { val: "done", key: "Done" }
                      ].map((item) => {
                        const style = getStatusDisplay(item.val);
                        return (
                          <button
                            key={item.val}
                            type="button"
                            onClick={() => {
                              setStatus(item.val as any);
                              handleAutoSave('status', item.val);
                              setIsStatusOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between ${status === item.val ? 'bg-slate-50/50' : ''}`}
                          >
                            <span className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                              <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                              {style.label}
                            </span>
                            {status === item.val && (
                              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* ASSIGNEE SELECT */}
              <div className="space-y-1.5 relative">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Assignee</label>
                <button
                  type="button"
                  onClick={() => setIsAssigneeOpen(!isAssigneeOpen)}
                  className="w-full bg-white hover:bg-slate-50/80 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-700 outline-none flex items-center justify-between transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2.5">
                    {assignedToId ? (
                      <span className="w-6 h-6 rounded-full bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                        {currentAssigneeInfo.short}
                      </span>
                    ) : (
                      <div className="w-6 h-6 rounded-full border border-slate-200 text-slate-400 flex items-center justify-center bg-slate-50">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                    <span className="text-xs font-semibold text-slate-700">{currentAssigneeInfo.name}</span>
                  </div>
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isAssigneeOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsAssigneeOpen(false)} />
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200/80 rounded-2xl shadow-xl z-50 p-1.5 flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                      {[
                        { val: "" as const, label: "Unassigned" },
                        { val: 1, label: "demo" },
                        { val: 2, label: "jane" }
                      ].map((item) => {
                        const style = getAssigneeDisplay(item.val);
                        return (
                          <button
                            key={item.val}
                            type="button"
                            onClick={() => {
                              setAssignedToId(item.val);
                              handleAutoSave('assigned_to_id', item.val);
                              setIsAssigneeOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between ${assignedToId === item.val ? 'bg-slate-50/50' : ''}`}
                          >
                            <div className="flex items-center gap-2.5">
                              {item.val ? (
                                <span className="w-6 h-6 rounded-full bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                                  {style.short}
                                </span>
                              ) : (
                                <div className="w-6 h-6 rounded-full border border-slate-200 text-slate-400 flex items-center justify-center bg-slate-50">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                              )}
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold text-slate-700">{style.name}</span>
                                {item.val && <span className="text-[9px] text-slate-400 font-medium">{style.email}</span>}
                              </div>
                            </div>
                            {assignedToId === item.val && (
                              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* PRIORITY SELECT */}
              <div className="space-y-1.5 relative">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Priority</label>
                <button
                  type="button"
                  onClick={() => setIsPriorityOpen(!isPriorityOpen)}
                  className="w-full bg-white hover:bg-slate-50/80 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-700 outline-none flex items-center justify-between transition-all active:scale-[0.99]"
                >
                  <span className={`flex items-center gap-2 px-2.5 py-1 text-xs font-bold rounded-full ${currentPriorityInfo.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${currentPriorityInfo.dot}`} />
                    {currentPriorityInfo.label}
                  </span>
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isPriorityOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsPriorityOpen(false)} />
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200/80 rounded-2xl shadow-xl z-50 p-1.5 flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                      {[
                        { val: "low", label: "Low" },
                        { val: "medium", label: "Medium" },
                        { val: "high", label: "High" },
                        { val: "urgent", label: "Urgent" }
                      ].map((item) => {
                        const style = getPriorityDisplay(item.val);
                        return (
                          <button
                            key={item.val}
                            type="button"
                            onClick={() => {
                              setPriority(item.val as any);
                              handleAutoSave('priority', item.val);
                              setIsPriorityOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between ${priority === item.val ? 'bg-slate-50/50' : ''}`}
                          >
                            <span className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                              <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                              {style.label}
                            </span>
                            {priority === item.val && (
                              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* DUE DATE */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Due Date</label>
                <input 
                  type="date"
                  value={dueDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => {
                    setDueDate(e.target.value);
                    handleAutoSave('due_date', e.target.value || null);
                  }}
                  className="w-full bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all cursor-pointer"
                />
              </div>

              <div className="mt-auto pt-6 border-t border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  Created Task
                </div>
                <div className="text-xs text-slate-500 font-medium mt-1">
                  {new Date(task.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-[400px] bg-white rounded-[24px] p-8 border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1.5">Delete task</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">Are you sure you want to delete this task? This action cannot be undone and will permanently remove the task.</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm py-2.5 rounded-xl transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm py-2.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(220,38,38,0.1)] active:scale-95 disabled:opacity-75 flex items-center justify-center"
              >
                {isDeleting ? (
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
    </>
  );
};
