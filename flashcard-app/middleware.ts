import { type NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@/services/supabase/middleware";

const PROTECTED = ["/dashboard", "/profile", "/learning"];
const ADMIN_ONLY = ["/admin"];
const AUTH_PAGES = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request);
  const pathname = request.nextUrl.pathname;

  // getUser() is the ONLY reliable way to check session in middleware.
  // It validates the JWT with Supabase and refreshes if needed, writing
  // updated tokens back via setAll → cookies on `response`.
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const isLoggedIn = !!user && !error;

  // ── Redirect logged-in users away from auth pages ──
  if (isLoggedIn && AUTH_PAGES.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // ── Protect dashboard / learning / profile ──
  if (!isLoggedIn && PROTECTED.some((p) => pathname.startsWith(p))) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // ── Protect admin routes ──
  if (ADMIN_ONLY.some((p) => pathname.startsWith(p))) {
    if (!isLoggedIn) {
      const url = new URL("/login", request.url);
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    // Role is stored in public.users; user_metadata is set at signup
    const role = user?.user_metadata?.role as string | undefined;
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Always return `response` so refreshed session cookies are forwarded
  return response;
}

export const config = {
  matcher: [
    // Run on everything except Next internals and static assets
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
