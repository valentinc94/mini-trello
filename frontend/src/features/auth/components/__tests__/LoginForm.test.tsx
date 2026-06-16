import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { LoginForm } from "../LoginForm";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock AuthService
jest.mock("@/services/auth.service", () => ({
  AuthService: {
    login: jest.fn().mockResolvedValue({ user_id: 1, username: "demo" }),
  },
}));

describe("LoginForm Component", () => {
  it("renders the login form correctly", () => {
    render(<LoginForm />);
    
    expect(screen.getByText("Welcome back")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("name@company.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("updates input values and submits the form", async () => {
    render(<LoginForm />);
    
    const usernameInput = screen.getByPlaceholderText("name@company.com");
    const passwordInput = screen.getByPlaceholderText("••••••••");
    const submitButton = screen.getByRole("button", { name: "Sign in" });

    // Interaction
    fireEvent.change(usernameInput, { target: { value: "demo" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    
    expect(usernameInput).toHaveValue("demo");
    expect(passwordInput).toHaveValue("password123");

    // Submit
    fireEvent.click(submitButton);

    // Expect loading state on button (spinner svg or disabled state should appear)
    expect(submitButton).toBeDisabled();
  });
});
