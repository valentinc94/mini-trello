import { fetchApi } from "@/lib/api";
import { Task, TaskStatus } from "@/types/models";

export const TaskService = {
  // Client-side fetching
  async updateTaskStatus(taskId: number, status: TaskStatus): Promise<Task> {
    return fetchApi(`/tasks/${taskId}/`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  async updateTask(taskId: number, data: Partial<Task>): Promise<Task> {
    return fetchApi(`/tasks/${taskId}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async createTask(projectId: number, data: Partial<Task>): Promise<Task> {
    return fetchApi(`/projects/${projectId}/tasks/`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async deleteTask(taskId: number): Promise<void> {
    return fetchApi(`/tasks/${taskId}/`, {
      method: "DELETE",
    });
  }
};
