import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // CRITICAL: must create a new response and pass it through
  // so Supabase can write refreshed session cookies
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options?: CookieOptions }[]
        ) {
          // Write cookies onto request so subsequent server reads see them
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Recreate response with updated request headers
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          // Write cookies onto the response so browser persists them
          cookiesToSet.forEach(({ name, value, options }) =>
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

  // ALWAYS call getUser() — this refreshes the session token if needed
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  console.log("[middleware] pathname:", request.nextUrl.pathname);
  console.log("[middleware] user:", user?.id ?? null, "error:", error?.message ?? null);

  const { pathname } = request.nextUrl;

  // ── Protected user routes ──
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/learning")
  ) {
    if (!user) {
      console.log("[middleware] no user → redirect /login");
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  // ── Protected admin routes ──
  if (pathname.startsWith("/admin")) {
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

    if (!profile || profile.role !== "ADMIN") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  // ── Redirect logged-in users away from auth pages ──
  if ((pathname === "/login" || pathname === "/register") && user) {
    console.log("[middleware] already logged in → redirect /dashboard");
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files (svg, png, jpg…)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
