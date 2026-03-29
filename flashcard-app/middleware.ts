import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
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
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
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
  const { data: { user } } = await supabase.auth.getUser();

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
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // ── Redirect logged-in users away from login/register ─────────────────
  // NOTE: /forgot-password và /reset-password vẫn accessible khi đã login
  const authOnlyPaths = ["/login", "/register"];
  if (authOnlyPaths.includes(path) && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
