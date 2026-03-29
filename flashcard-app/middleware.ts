import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  /**
   * CRITICAL PATTERN (Supabase docs):
   * 1. Create a mutable `response` variable.
   * 2. Pass request headers — not the full request — so cookies are forwarded.
   * 3. In setAll, write cookies to BOTH request AND a new response.
   * 4. Always return `response` (never a fresh NextResponse.next()).
   */
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(list: { name: string; value: string; options?: CookieOptions }[]) {
          // Mutate the request cookies so subsequent reads in this request see them
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          // Build a fresh response that carries the updated request headers
          response = NextResponse.next({ request: { headers: request.headers } });
          // Write cookies to the response so the browser stores them
          list.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              path: "/",
              sameSite: "lax",
              httpOnly: true,
              ...options,
            })
          );
        },
      },
    }
  );

  // ALWAYS call getUser() to refresh the session token when needed
  const { data: { user }, error } = await supabase.auth.getUser();

  console.log("[mw]", request.nextUrl.pathname, "| user:", user?.id ?? "none", error?.message ?? "");

  const path = request.nextUrl.pathname;

  // ── Protected user routes ─────────────────────────────────────────────
  const userProtected =
    path.startsWith("/dashboard") ||
    path.startsWith("/profile") ||
    path.startsWith("/learning");

  if (userProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // ── Protected admin routes ────────────────────────────────────────────
  if (path.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    // Inline admin check (avoid extra DB round-trip for non-admin pages)
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // ── Redirect already-logged-in users away from auth pages ─────────────
  if ((path === "/login" || path === "/register") && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
