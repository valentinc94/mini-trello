import { fetchServerApi } from "@/lib/serverApi";
import { User } from "@/types/models";

export const AuthServerService = {
  async getMeServer(): Promise<{ data: User | null; error?: string; status: number }> {
    const res = await fetchServerApi<User & { user_id?: number }>("/auth/me/");
    if (res.data && res.data.user_id && !res.data.id) {
      res.data = {
        ...res.data,
        id: res.data.user_id,
      };
    }
    return res;
  }
};
