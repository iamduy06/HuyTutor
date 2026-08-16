import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client (Server Components, Route Handlers, Actions).
 */
export function createClient() {
  const store = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://supabase-proxy.huynhthanhduy06.workers.dev/";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "dummy_key";

  return createServerClient(url, key, {
    cookies: {
      getAll() { return store.getAll(); },
      setAll(list: { name: string; value: string; options?: CookieOptions }[]) {
        try {
          list.forEach(({ name, value, options }) =>
            store.set(name, value, { path: "/", sameSite: "lax", httpOnly: true, ...options })
          );
        } catch { /* Server Component writes ignored */ }
      },
    },
  });
}
