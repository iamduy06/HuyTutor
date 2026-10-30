import { cookies } from "next/headers";

/**
 * Retrieves the authenticated JWT token from HttpOnly cookie on the Next.js server.
 * Used by Server Components, Layouts, and Server Actions.
 */
export async function getServerToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("hut_access_token")?.value ?? null;
}
