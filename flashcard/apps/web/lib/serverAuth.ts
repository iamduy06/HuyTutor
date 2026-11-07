import { cookies } from "next/headers";

/**
 * Retrieves the authenticated JWT token from HttpOnly cookie on the Next.js server.
 * Prioritizes Master SSO cookie (COOKIE_DOMAIN) then local hut_access_token.
 * Used by Server Components, Layouts, and Server Actions.
 */
export async function getServerToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return (
    cookieStore.get("ht_sso_token")?.value ??
    cookieStore.get("hut_access_token")?.value ??
    null
  );
}

/**
 * Retrieves the client device ID from cookies on the Next.js server.
 */
export async function getServerDeviceId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("hut_device_id")?.value ?? null;
}
