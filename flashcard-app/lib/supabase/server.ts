import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client.
 * Must be called inside a Server Component, Route Handler, or Server Action.
 * Reads and writes cookies via next/headers.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options?: CookieOptions }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                path: "/",
                sameSite: "lax",
                httpOnly: true,
                ...options,
              })
            );
          } catch {
            // Called from a Server Component — cookie writes are a no-op.
            // Writes only work inside Route Handlers and Server Actions.
          }
        },
      },
    }
  );
}
