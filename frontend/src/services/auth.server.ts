import { fetchServerApi } from "@/lib/serverApi";
import { User } from "@/types/models";

export const AuthServerService = {
  async getMeServer(): Promise<{ data: User | null; error?: string; status: number }> {
    return fetchServerApi<User>("/auth/me/");
  }
};
