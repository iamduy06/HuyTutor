import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  // Read Master SSO Cookie (.huytutor.edu.vn) or fallback to local hut_access_token
  const token =
    request.cookies.get("ht_sso_token")?.value ||
    request.cookies.get("hut_access_token")?.value ||
    "";

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

  // 2. Protected user & admin routes
  const isProtectedPath =
    path.startsWith("/dashboard") ||
    path.startsWith("/profile") ||
    path.startsWith("/learning") ||
    path.startsWith("/game") ||
    path.startsWith("/admin") ||
    path.startsWith("/subadmin");

  if (isProtectedPath) {
    if (!token) {
      const host = request.headers.get("host") || "";
      if (host.includes("huytutor.edu.vn")) {
        const ssoUrl = `https://sso.huytutor.edu.vn/login?app=flashcard&redirect=${encodeURIComponent(request.url)}`;
        return NextResponse.redirect(new URL(ssoUrl));
      }

      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }
  }

  // 3. Redirect logged-in users away from /login and /register (unless error param is present)
  const hasAuthError = request.nextUrl.searchParams.has("error");
  if (["/login", "/register"].includes(path) && token && !hasAuthError) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
