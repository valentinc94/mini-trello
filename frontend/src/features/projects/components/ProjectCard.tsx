/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Project, User } from "@/types/models";
import { ProjectService } from "@/services/project.service";
import { Toast } from "@/components/ui/Toast";

interface ProjectCardProps {
  project: Project & {
    tasksCount: number;
    completedTasksCount: number;
    progress: number;
    assignees: User[];
  };
  currentUser: User;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, currentUser }) => {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectName, setProjectName] = useState(project.name);
  const [projectDescription, setProjectDescription] = useState(project.description);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState<{msg: string, type: 'success'|'error'} | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  const isOwner = project.owner.id === currentUser.id;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;
    setIsSaving(true);
    setError("");
    try {
      await ProjectService.updateProject(project.id, projectName, projectDescription);
      setIsEditing(false);
      setToastMessage({ msg: "Project details updated successfully!", type: "success" });
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to update project");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError("");
    try {
      await ProjectService.deleteProject(project.id);
      setShowDeleteConfirm(false);
      router.push("/?deleted=true");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to delete project");
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative group">
      {/* Main card link */}
      <Link href={`/projects/${project.id}`} className="block">
        <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.01)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:-translate-y-0.5 transition-all duration-300 border border-slate-100/80 p-6 flex flex-col h-[240px] cursor-pointer">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform shadow-[0_4px_12px_rgba(37,99,235,0.03)]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            
            {/* Options Button Placeholder to balance layout space */}
            {isOwner && <div className="w-8 h-8" />}
          </div>
          
          <h3 className="text-base font-bold text-slate-900 mb-1.5 line-clamp-1 pr-6">{project.name}</h3>
          <p className="text-xs text-slate-500 flex-grow mb-6 line-clamp-2 leading-relaxed">
            {project.description || "No description provided."}
          </p>
          
          <div className="mt-auto">
            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4 overflow-hidden">
              <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${project.progress}%` }}></div>
            </div>
            
            <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400">
              <span>{project.progress}% completed ({project.completedTasksCount}/{project.tasksCount} tasks)</span>
              <div className="flex -space-x-1.5">
                {project.assignees.slice(0, 3).map((assignee, idx) => (
                  <div 
                    key={assignee.id}
                    className="w-5 h-5 rounded-full border border-white bg-blue-100 text-blue-700 flex items-center justify-center text-[9px] font-bold"
                    style={{ zIndex: 3 - idx }}
                    title={assignee.username}
                  >
                    {assignee.username.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Floating 3-Dots Button & Dropdown Menu */}
      {isOwner && (
        <div ref={menuRef} className="absolute right-4 top-6 z-10">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200/80 rounded-2xl shadow-xl z-20 p-1.5 flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsMenuOpen(false);
                  setIsEditing(true);
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-all flex items-center gap-2"
              >
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Board
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsMenuOpen(false);
                  setShowDeleteConfirm(true);
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-all flex items-center gap-2"
              >
                <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Board
              </button>
            </div>
          )}
        </div>
      )}

      {/* Edit Board Modal */}
      {isEditing && (
        <div 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="w-full max-w-[450px] bg-white rounded-[24px] p-8 border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">Edit Board Settings</h3>
              <button 
                onClick={() => setIsEditing(false)} 
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
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
              {error && (
                <p className="text-xs font-semibold text-red-500 bg-red-50/50 border border-red-100 py-2 rounded-xl text-center">
                  {error}
                </p>
              )}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm py-2.5 rounded-xl transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(37,99,235,0.1)] active:scale-95 disabled:opacity-75 flex items-center justify-center"
                >
                  {isSaving ? (
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="w-full max-w-[400px] bg-white rounded-[24px] p-6 border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Delete Board?</h3>
              <p className="text-xs text-slate-500 mb-6 max-w-[280px]">
                Are you sure you want to delete <span className="font-semibold text-slate-700">“{project.name}”</span>? This action is permanent and will delete all associated tasks.
              </p>
              {error && (
                <p className="text-xs font-semibold text-red-500 bg-red-50/50 border border-red-100 py-2 rounded-xl text-center w-full mb-4">
                  {error}
                </p>
              )}
              <div className="flex items-center gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2.5 rounded-xl transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs py-2.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(220,38,38,0.1)] active:scale-95 disabled:opacity-75 flex items-center justify-center"
                >
                  {isDeleting ? (
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    "Delete Board"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
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
