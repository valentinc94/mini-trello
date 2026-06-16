export type TaskStatus = "to_do" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface User {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  owner: User;
  created_at: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  assigned_to: User | null;
  project: number;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
