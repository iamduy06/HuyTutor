/**
 * Server-side API client for Next.js Server Components / SSR pages.
 *
 * Instead of querying Supabase directly from the Next.js server,
 * all DB calls MUST go through the Express API server.
 *
 * Usage (inside an async Server Component):
 *   import { serverApiClient } from "@/lib/server-api-client";
 *   const data = await serverApiClient.get("/admin/dashboard");
 */

import { createClient } from "@/lib/supabase/server";

const getBaseApiUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "https://flashcard-api.huytutor.edu.vn";
  return url.replace(/\/+$/, "");
};

/**
 * Get the current user's Supabase access token from the server-side session.
 * Used to authenticate calls to the Express API server.
 */
async function getServerToken(): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch (err) {
    console.error("[serverApiClient] Failed to get session token:", err);
    return null;
  }
}

async function serverFetch<T>(path: string, options?: RequestInit, retries = 2): Promise<T> {
  const token = await getServerToken();
  const baseUrl = getBaseApiUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const fullUrl = `${baseUrl}/api${cleanPath}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch(fullUrl, {
        ...options,
        headers: { ...headers, ...(options?.headers as Record<string, string> ?? {}) },
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        let errorMessage = `HTTP ${res.status}`;
        try {
          const body = await res.json();
          errorMessage = body?.error || body?.message || errorMessage;
        } catch { /* ignore */ }

        // If 401 or 403, don't retry as it's an authorization issue
        if (res.status === 401 || res.status === 403 || res.status === 404) {
          throw new Error(`[${res.status}] ${errorMessage} (${fullUrl})`);
        }

        // For 5xx errors, retry if attempts remain
        if (attempt < retries) {
          console.warn(`[serverApiClient] Attempt ${attempt + 1} got ${res.status} from ${fullUrl}. Retrying in 1s...`);
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }

        throw new Error(`[${res.status}] ${errorMessage} (${fullUrl})`);
      }

      return await res.json() as T;
    } catch (err: any) {
      clearTimeout(timeoutId);

      // Don't retry auth errors
      if (err?.message?.includes("[401]") || err?.message?.includes("[403]") || err?.message?.includes("[404]")) {
        throw err;
      }

      if (attempt < retries) {
        console.warn(`[serverApiClient] Attempt ${attempt + 1} failed for ${fullUrl} (${err?.message}). Retrying in 1s...`);
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }

      console.error(`[serverApiClient] Request to ${fullUrl} failed after ${retries + 1} attempts:`, err?.message || err);
      throw err;
    }
  }

  throw new Error(`[serverApiClient] Failed to fetch ${fullUrl}`);
}

export const serverApiClient = {
  /**
   * GET /api/...
   * @param path e.g. "/admin/dashboard", "/me/dashboard"
   */
  get: <T = any>(path: string) => serverFetch<T>(path),

  /**
   * POST /api/...
   */
  post: <T = any>(path: string, body?: any) =>
    serverFetch<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),

  /**
   * PATCH /api/...
   */
  patch: <T = any>(path: string, body?: any) =>
    serverFetch<T>(path, { method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined }),
};

