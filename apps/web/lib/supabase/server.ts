import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client for Next.js 15 (Server Components, Actions).
 */
export async function createClient() {
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return store.getAll();
        },
        setAll(list: { name: string; value: string; options?: CookieOptions }[]) {
          try {
            list.forEach(({ name, value, options }) =>
              store.set(name, value, { path: "/", sameSite: "lax", httpOnly: true, ...options })
            );
          } catch {
            /* Server Component — writes ignored */
          }
        },
      },
    }
  );
}
