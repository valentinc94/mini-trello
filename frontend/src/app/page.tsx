import { AuthServerService } from "@/services/auth.server";
import { ProjectServerService } from "@/services/project.server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { ProjectCard } from "@/features/projects/components/ProjectCard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard | Q-Tasks",
};

function isDueThisWeek(dueDateStr: string | null): boolean {
  if (!dueDateStr) return false;
  const dueDate = new Date(dueDateStr);
  const now = new Date();
  
  // Start of current week (Sunday)
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  // End of current week (Saturday)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return dueDate >= startOfWeek && dueDate <= endOfWeek;
}

export default async function DashboardPage() {
  const { data: user, status: authStatus } = await AuthServerService.getMeServer();
  
  if (authStatus !== 200 || !user) {
    redirect("/login");
  }

  const { data: projectsData } = await ProjectServerService.getProjectsServer();
  const projects = projectsData?.results || [];

  // Fetch tasks for each project to calculate actual stats and progress
  const projectsTasksResults = await Promise.all(
    projects.map(p => ProjectServerService.getProjectTasksServer(p.id))
  );

  let completedTasksCount = 0;
  let dueThisWeekCount = 0;

  const projectsWithStats = projects.map((project, index) => {
    const tasks = projectsTasksResults[index]?.data?.results || [];
    const completed = tasks.filter(t => t.status === "done").length;
    const total = tasks.length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    completedTasksCount += completed;
    
    tasks.forEach(t => {
      if (t.status !== "done" && isDueThisWeek(t.due_date)) {
        dueThisWeekCount++;
      }
    });

    const assigneesMap = new Map();
    tasks.forEach(t => {
      if (t.assigned_to) {
        assigneesMap.set(t.assigned_to.id, t.assigned_to);
      }
    });
    const assignees = Array.from(assigneesMap.values());

    return {
      ...project,
      tasksCount: total,
      completedTasksCount: completed,
      progress,
      assignees
    };
  });

  return (
    <SidebarLayout user={user} title="Projects Dashboard">
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Welcome back, {user.first_name || user.username}!</h2>
            <p className="text-slate-500 mt-1 text-sm">Here&apos;s an overview of your active projects.</p>
          </div>
          <Link 
            href="/?new-project=true"
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-[0_4px_12px_rgba(37,99,235,0.1)] hover:shadow-[0_4px_16px_rgba(37,99,235,0.2)] active:scale-95 flex items-center justify-center sm:justify-start gap-2 w-full sm:w-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </Link>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="bg-white p-6 rounded-[24px] border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-[0_4px_12px_rgba(37,99,235,0.05)]">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Projects</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{projects.length}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[24px] border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-[0_4px_12px_rgba(16,185,129,0.05)]">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed Tasks</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{completedTasksCount}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[24px] border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-[0_4px_12px_rgba(245,158,11,0.05)]">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Due This Week</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{dueThisWeekCount}</h3>
            </div>
          </div>
        </div>

        {projectsWithStats.length === 0 ? (
          <div className="bg-white rounded-[32px] border border-slate-100/80 p-16 text-center max-w-2xl mx-auto mt-12 shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
            <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-100">
              <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No projects yet</h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">Create your first project to start organizing tasks, managing your team, and tracking progress.</p>
            <Link 
              href="/?new-project=true"
              className="bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              Create New Project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projectsWithStats.map((project) => (
              <ProjectCard key={project.id} project={project} currentUser={user} />
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
