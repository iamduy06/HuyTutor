import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Creates a Supabase client wired to the middleware request/response cycle.
 * Returns both the client and the (potentially mutated) response so cookies
 * are forwarded correctly.
 */
export function createMiddlewareClient(request: NextRequest) {
  // We must NOT reassign this inside setAll — always mutate the same object
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write onto the request so downstream server components can read
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          // Write onto the response so the browser receives the cookie
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...options,
              // Enforce 3-day session
              maxAge: 60 * 60 * 24 * 3,
              sameSite: "lax",
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
            })
          );
        },
      },
    }
  );

  return { supabase, response };
}
