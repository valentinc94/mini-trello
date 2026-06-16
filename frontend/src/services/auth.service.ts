/* eslint-disable @typescript-eslint/no-explicit-any */
import { fetchApi } from "@/lib/api";

export const AuthService = {
  async login(username: string, password: string):Promise<{user_id: number; username: string}> {
    return fetchApi("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  async logout(): Promise<void> {
    return fetchApi("/auth/logout/", {
      method: "POST",
    });
  },

  async register(data: any): Promise<void> {
    return fetchApi("/auth/register/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
};
