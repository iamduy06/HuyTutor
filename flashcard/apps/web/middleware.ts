import { NextResponse, type NextRequest } from "next/server";
import { getSsoUrl, getAppUrl } from "@/lib/sso";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  // Read Master SSO Cookie or fallback to local hut_access_token
  const ssoCookie = request.cookies.get("ht_sso_token");
  const localCookie = request.cookies.get("hut_access_token");
  const token = ssoCookie ? ssoCookie.value : (localCookie ? localCookie.value : "");

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
      const ssoBase = getSsoUrl();
      const ssoUrl = ssoBase
        ? `${ssoBase}/login?app=flashcard&redirect=${encodeURIComponent(request.url)}`
        : `/login?redirect=${encodeURIComponent(request.url)}`;
      return NextResponse.redirect(new URL(ssoUrl, request.url));
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
      const appBase = getAppUrl();
      const redirectTarget = nextParam
        ? (nextParam.startsWith("http")
            ? nextParam
            : (appBase ? `${appBase}${nextParam.startsWith("/") ? nextParam : `/${nextParam}`}` : new URL(nextParam, request.url).toString()))
        : (appBase ? `${appBase}/dashboard` : new URL("/dashboard", request.url).toString());

      const ssoBase = getSsoUrl();
      if (ssoBase) {
        const ssoUrl = `${ssoBase}/${ssoRoute}?app=flashcard&redirect=${encodeURIComponent(redirectTarget)}`;
        return NextResponse.redirect(new URL(ssoUrl));
      }
    }
  }

  // 4. Centralized SSO Redirection for /devices
  if (path === "/devices") {
    const ssoBase = getSsoUrl();
    if (ssoBase) {
      return NextResponse.redirect(new URL(`${ssoBase}/devices`));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
