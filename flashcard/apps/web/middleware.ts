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

      const ssoUrl = `https://sso.huytutor.edu.vn/login?app=flashcard&redirect=${encodeURIComponent(request.url)}`;
      return NextResponse.redirect(new URL(ssoUrl));
    }
  }

  // 3. Centralized SSO Redirection for Auth Routes (/login, /register, /forgot-password)
  const hasAuthError = request.nextUrl.searchParams.has("error");
  if (["/login", "/register", "/forgot-password"].includes(path)) {
    if (token && !hasAuthError) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (!token && !hasAuthError) {
      const ssoRoute = path === "/register" ? "register" : path === "/forgot-password" ? "forgot-password" : "login";
      const nextParam = request.nextUrl.searchParams.get("next");
      const redirectTarget = nextParam
        ? (nextParam.startsWith("http") ? nextParam : `https://flashcard.huytutor.edu.vn${nextParam.startsWith("/") ? nextParam : `/${nextParam}`}`)
        : "https://flashcard.huytutor.edu.vn/dashboard";
      const ssoUrl = `https://sso.huytutor.edu.vn/${ssoRoute}?app=flashcard&redirect=${encodeURIComponent(redirectTarget)}`;
      return NextResponse.redirect(new URL(ssoUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
