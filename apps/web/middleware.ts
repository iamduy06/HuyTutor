import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get("hut_access_token")?.value || "";

  // 1. Inject Bearer Token for API proxy routes
  if (path.startsWith("/api/")) {
    if (!request.headers.get("authorization") && token) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("authorization", `Bearer ${token}`);
      return NextResponse.next({
        request: { headers: requestHeaders },
      });
    }
    return NextResponse.next();
  }

  // 2. Option B (Clean Cutover Policy):
  // Check if user has legacy Supabase cookies but no new hut_access_token
  const allCookies = request.cookies.getAll();
  const hasLegacyCookie = allCookies.some(c => c.name.startsWith("sb-"));

  // 3. Protected user & admin routes
  const isProtectedPath =
    path.startsWith("/dashboard") ||
    path.startsWith("/profile") ||
    path.startsWith("/learning") ||
    path.startsWith("/game") ||
    path.startsWith("/admin") ||
    path.startsWith("/subadmin");

  if (isProtectedPath) {
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", path);
      const redirectRes = NextResponse.redirect(url);
      // Clean up legacy cookies on response
      allCookies.forEach(c => {
        if (c.name.startsWith("sb-")) {
          redirectRes.cookies.set(c.name, "", { path: "/", maxAge: 0 });
        }
      });
      return redirectRes;
    }
  }

  // 4. Redirect logged-in users away from /login and /register
  if (["/login", "/register"].includes(path) && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
