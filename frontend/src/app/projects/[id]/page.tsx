import { AuthServerService } from "@/services/auth.server";
import { ProjectServerService } from "@/services/project.server";
import { TaskServerService } from "@/services/task.server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { KanbanBoard } from "@/features/tasks/components/KanbanBoard";

export const dynamic = "force-dynamic";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { data: user, status: authStatus } = await AuthServerService.getMeServer();
  if (authStatus !== 200 || !user) {
    redirect("/login");
  }

  const { data: project, status: projectStatus } = await ProjectServerService.getProjectByIdServer(params.id);
  
  if (projectStatus !== 200 || !project) {
    return (
      <SidebarLayout user={user} title="Project Not Found">
        <div className="flex flex-col items-center justify-center h-[60vh] p-8 text-center animate-in fade-in duration-300">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Project not found</h2>
          <p className="text-slate-500 mb-6 max-w-sm">The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.</p>
          <Link 
            href="/"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all shadow-[0_4px_12px_rgba(37,99,235,0.1)] active:scale-95"
          >
            Go back to Dashboard
          </Link>
        </div>
      </SidebarLayout>
    );
  }

  const { data: tasksData } = await TaskServerService.getTasksForProjectServer(params.id);
  const tasks = tasksData?.results || [];

  return (
    <SidebarLayout user={user} title={project.name}>
      <div className="flex flex-col h-full bg-slate-50/50 animate-in fade-in duration-300">
        {/* Kanban Board Container */}
        <div className="flex-1 overflow-x-auto px-6 sm:px-8 pb-8 pt-4">
          <KanbanBoard project={project} user={user} initialTasks={tasks} />
        </div>
      </div>
    </SidebarLayout>
  );
}
