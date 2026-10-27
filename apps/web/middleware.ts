import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const path = request.nextUrl.pathname;

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

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  // ── Inject Bearer Token cho các API routes chuyển tiếp sang Express Backend ─
  if (path.startsWith("/api/")) {
    if (!request.headers.get("authorization") && session?.access_token) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("authorization", `Bearer ${session.access_token}`);
      return NextResponse.next({
        request: { headers: requestHeaders },
      });
    }
    return response;
  }

  // ── Protected user routes ──────────────────────────────────────────────
  if (
    path.startsWith("/dashboard") ||
    path.startsWith("/profile") ||
    path.startsWith("/learning") ||
    path.startsWith("/game")
  ) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }
  }

  // ── Protected admin routes (Role check do AdminLayout xử lý) ───────────
  if (path.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  // ── Protected subadmin routes (Role check do SubAdminLayout xử lý) ──────
  if (path.startsWith("/subadmin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  // ── Redirect logged-in users away from login/register ─────────────────
  if (["/login", "/register"].includes(path) && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
