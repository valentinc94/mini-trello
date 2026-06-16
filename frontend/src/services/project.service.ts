import { fetchApi } from "@/lib/api";
import { PaginatedResponse, Project } from "@/types/models";

/**
 * Encapsulates all Project-related API calls.
 * Adheres to Dependency Inversion by abstracting fetch logic.
 */
export const ProjectService = {
  // Client-side fetching
  async getProjectsClient(): Promise<PaginatedResponse<Project>> {
    return fetchApi("/projects/");
  },

  async createProject(name: string, description: string): Promise<Project> {
    return fetchApi("/projects/", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    });
  },

  async updateProject(id: number, name: string, description: string): Promise<Project> {
    return fetchApi(`/projects/${id}/`, {
      method: "PATCH",
      body: JSON.stringify({ name, description }),
    });
  },

  async deleteProject(id: number): Promise<void> {
    return fetchApi(`/projects/${id}/`, {
      method: "DELETE",
    });
  }
};
