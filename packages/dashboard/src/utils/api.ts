import { API_BASE_URL } from "@/constants/api";

interface ApiOptions {
  method?: string;
  body?: Record<string, unknown>;
  token?: string;
}

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export async function apiFetch<T>(
  path: string,
  options: ApiOptions = {}
): Promise<ApiResponse<T>> {
  const { method = "GET", body, token } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });

    const json = await response.json();

    if (!response.ok) {
      const errorMessage =
        (json as { error?: string }).error ?? `Request failed with status ${response.status}`;
      return { data: null, error: errorMessage };
    }

    return { data: json as T, error: null };
  } catch {
    return { data: null, error: "Network error: unable to reach the server" };
  }
}
