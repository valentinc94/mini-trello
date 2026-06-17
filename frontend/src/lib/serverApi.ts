import { cookies } from "next/headers";

const SERVER_API_URL = "http://backend:8000/api/v1";

export async function fetchServerApi<T>(endpoint: string, options: RequestInit = {}): Promise<{ data: T | null; error?: string; status: number }> {
  const cookieStore = cookies();
  const cookieString = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const url = `${SERVER_API_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieString,
      ...options.headers,
    },
    // We don't want Next.js aggressive caching for authenticated dynamic data
    cache: "no-store",
  });

  if (response.status === 401) {
    return { data: null, error: "unauthorized", status: 401 };
  }

  if (response.status === 204) {
    return { data: null, status: 204 };
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    return { data: null, error: data?.detail || `HTTP ${response.status}`, status: response.status };
  }

  return { data: data as T, status: response.status };
}
