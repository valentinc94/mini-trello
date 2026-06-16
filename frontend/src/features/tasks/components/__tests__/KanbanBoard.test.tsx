import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { KanbanBoard } from "../KanbanBoard";
import { Task, Project, User } from "@/types/models";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

const mockProject: Project = {
  id: 1,
  name: "Test Project",
  description: "Test description",
  owner: { id: 1, username: "demo" },
  created_at: new Date().toISOString()
};

const mockUser: User = {
  id: 1,
  username: "demo"
};

const mockTasks: Task[] = [
  {
    id: 1,
    title: "Test Task 1",
    description: "Description 1",
    status: "to_do",
    priority: "high",
    due_date: null,
    assigned_to: null,
    project: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: "Test Task 2",
    description: "Description 2",
    status: "done",
    priority: "low",
    due_date: null,
    assigned_to: null,
    project: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

describe("KanbanBoard Component", () => {
  it("renders columns and tasks correctly", () => {
    render(<KanbanBoard project={mockProject} user={mockUser} initialTasks={mockTasks} />);
    
    // Check Columns
    expect(screen.getByText("To Do")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();

    // Check Tasks
    expect(screen.getByText("Test Task 1")).toBeInTheDocument();
    expect(screen.getByText("Test Task 2")).toBeInTheDocument();
  });

  it("opens the TaskDetailModal when a task is clicked", () => {
    render(<KanbanBoard project={mockProject} user={mockUser} initialTasks={mockTasks} />);
    
    // The modal should not be present initially
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Interaction: click on a task
    const taskCard = screen.getByText("Test Task 1").closest("div[draggable]");
    if (taskCard) fireEvent.click(taskCard);

    // Modal should appear
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    
    // Modal contains full description
    expect(screen.getAllByText("Description 1").length).toBeGreaterThanOrEqual(1);
  });
});
