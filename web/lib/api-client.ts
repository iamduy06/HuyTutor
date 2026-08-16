/**
 * Centralized API client for calling the Backend (Render).
 *
 * Usage:
 *   import { apiClient } from "@/lib/api-client";
 *   const data = await apiClient.get("/decks");
 *   const data = await apiClient.post("/progress", { deck_id, progress_percent });
 *
 * Auth token is automatically fetched from Supabase session and attached
 * as Authorization: Bearer <token> header.
 */

import { createBrowserClient } from "@supabase/ssr";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

// Get current Supabase access token from browser session
async function getAccessToken(): Promise<string | null> {
  try {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

async function buildHeaders(includeAuth = true): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (includeAuth) {
    const token = await getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMessage = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      errorMessage = body?.error || body?.message || errorMessage;
    } catch {
      // ignore JSON parse error
    }
    throw new Error(errorMessage);
  }

  // Some responses may be binary (xlsx, csv)
  const contentType = res.headers.get("content-type") || "";
  if (
    contentType.includes("application/vnd.openxmlformats") ||
    contentType.includes("text/csv")
  ) {
    return res.blob() as unknown as T;
  }

  return res.json() as T;
}

export const apiClient = {
  /**
   * GET /api/...
   * @param path e.g. "/decks", "/progress?deck_id=xxx"
   * @param auth whether to attach Authorization header (default: true)
   */
  async get<T = any>(path: string, auth = true): Promise<T> {
    const headers = await buildHeaders(auth);
    const res = await fetch(`${API_URL}/api${path}`, {
      method: "GET",
      headers,
    });
    return handleResponse<T>(res);
  },

  /**
   * POST /api/...
   */
  async post<T = any>(path: string, body?: any, auth = true): Promise<T> {
    const headers = await buildHeaders(auth);
    const res = await fetch(`${API_URL}/api${path}`, {
      method: "POST",
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(res);
  },

  /**
   * PUT /api/...
   */
  async put<T = any>(path: string, body?: any, auth = true): Promise<T> {
    const headers = await buildHeaders(auth);
    const res = await fetch(`${API_URL}/api${path}`, {
      method: "PUT",
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(res);
  },

  /**
   * PATCH /api/...
   */
  async patch<T = any>(path: string, body?: any, auth = true): Promise<T> {
    const headers = await buildHeaders(auth);
    const res = await fetch(`${API_URL}/api${path}`, {
      method: "PATCH",
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(res);
  },

  /**
   * DELETE /api/...
   */
  async delete<T = any>(path: string, body?: any, auth = true): Promise<T> {
    const headers = await buildHeaders(auth);
    const res = await fetch(`${API_URL}/api${path}`, {
      method: "DELETE",
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(res);
  },

  /**
   * Raw fetch for special cases (file upload, form data, etc.)
   */
  async raw(path: string, init: RequestInit, auth = true): Promise<Response> {
    if (auth) {
      const token = await getAccessToken();
      if (token) {
        init.headers = {
          ...init.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }
    return fetch(`${API_URL}/api${path}`, init);
  },
};
