"use client";

import React, { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { User } from "@/types/models";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { CreateProjectModal } from "@/features/projects/components/CreateProjectModal";

interface SidebarLayoutProps {
  children: React.ReactNode;
  user: User;
  title: string;
}

const SidebarLayoutContent: React.FC<SidebarLayoutProps> = ({ children, user, title }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const isCreateProjectOpen = searchParams.get("new-project") === "true";

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Close sidebar on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const openCreateProject = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("new-project", "true");
    router.push(`${pathname}?${params.toString()}`);
  };

  const closeCreateProject = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("new-project");
    const search = params.toString();
    router.push(`${pathname}${search ? `?${search}` : ""}`);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-50 border-r border-slate-200/80 flex flex-col shrink-0
        transform transition-transform duration-200 ease-out
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_4px_12px_rgba(37,99,235,0.15)]">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="font-bold text-slate-900 tracking-tight">Q-Tasks</span>
          </Link>
          {/* Close sidebar button (mobile only) */}
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-3 flex flex-col gap-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2 mt-4">Projects</div>
          
          {/* Active Project Card */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white text-slate-900 rounded-xl text-sm font-semibold border border-slate-200/60 shadow-[0_4px_12px_rgb(0,0,0,0.01)]">
            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
            <span className="truncate">{title}</span>
          </div>
          
          <button 
            onClick={openCreateProject}
            className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 rounded-xl text-sm font-semibold transition-colors mt-2 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100 mt-auto">
          <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-100/80 rounded-xl cursor-pointer transition-colors">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
              {user.first_name ? user.first_name.charAt(0) : user.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-semibold text-slate-900 leading-none truncate">
                {user.first_name || user.username}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-14 bg-white/50 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-2 text-sm min-w-0">
            {/* Mobile hamburger */}
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors mr-1"
              aria-label="Open sidebar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link 
              href="/" 
              className="text-slate-500 font-medium hover:text-slate-950 transition-colors hidden sm:inline"
            >
              Projects
            </Link>
            <svg className="w-4 h-4 text-slate-300 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-slate-900 font-semibold truncate">{title}</span>
          </div>
          
          <div className="flex items-center gap-4 shrink-0">
            <LogoutButton />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden relative">
          {children}
        </main>
      </div>

      {isCreateProjectOpen && (
        <CreateProjectModal onClose={closeCreateProject} />
      )}
    </div>
  );
};

export const SidebarLayout: React.FC<SidebarLayoutProps> = (props) => {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    }>
      <SidebarLayoutContent {...props} />
    </Suspense>
  );
};
