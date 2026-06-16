import { fetchServerApi } from "@/lib/serverApi";
import { PaginatedResponse, Task } from "@/types/models";

export const TaskServerService = {
  async getTasksForProjectServer(projectId: number | string): Promise<{ data: PaginatedResponse<Task> | null; error?: string; status: number }> {
    return fetchServerApi<PaginatedResponse<Task>>(`/projects/${projectId}/tasks/`);
  }
};
