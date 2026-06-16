import { fetchServerApi } from "@/lib/serverApi";
import { PaginatedResponse, Project, Task } from "@/types/models";

export const ProjectServerService = {
  async getProjectsServer(): Promise<{ data: PaginatedResponse<Project> | null; error?: string; status: number }> {
    return fetchServerApi<PaginatedResponse<Project>>("/projects/");
  },

  async getProjectByIdServer(id: number | string): Promise<{ data: Project | null; error?: string; status: number }> {
    return fetchServerApi<Project>(`/projects/${id}/`);
  },

  async getProjectTasksServer(projectId: number | string): Promise<{ data: PaginatedResponse<Task> | null; error?: string; status: number }> {
    return fetchServerApi<PaginatedResponse<Task>>(`/projects/${projectId}/tasks/`);
  }
};
