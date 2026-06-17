// Use relative path for client-side fetches (Nginx will proxy it)
export const API_BASE_URL = "/api/v1";

/**
 * Custom fetch wrapper that automatically includes credentials (cookies)
 * and handles common error scenarios.
 */
export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    // CRITICAL: This ensures the httpOnly JWT cookie is sent with every request
    credentials: "include", 
  });

  // If unauthorized (401), we might want to trigger a refresh or redirect to login.
  // For the scope of this challenge, throwing an error lets the caller handle it.
  if (response.status === 401) {
    throw new Error("Unauthorized");
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.detail || data?.error || `HTTP Error ${response.status}`);
  }

  return data;
}
