import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getApiUrl } from "@/lib/apiUrl";
import { getCookieDomain, getSsoUrl } from "@/lib/sso";

async function performLogout(req: Request) {
  const cookieStore = await cookies();
  const ssoCookie = cookieStore.get("ht_sso_token")?.value;
  const localCookie = cookieStore.get("hut_access_token")?.value;
  const authHeader = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const token = authHeader || ssoCookie || localCookie || "";

  // 1. Notify Backend API & SSO API asynchronously with timeout so logout never hangs
  const apiUrl = getApiUrl();
  const ssoUrl = getSsoUrl();

  const notifyPromises: Promise<any>[] = [];

  if (apiUrl && token) {
    notifyPromises.push(
      fetch(`${apiUrl}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(2000),
      }).catch(() => {})
    );
  }

  if (ssoUrl && token) {
    notifyPromises.push(
      fetch(`${ssoUrl}/api/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(2000),
      }).catch(() => {})
    );
  }

  try {
    await Promise.allSettled(notifyPromises);
  } catch {
    /* Ignore background revocation errors */
  }

  const response = NextResponse.json({ success: true, message: "Logged out successfully" });

  const isProd = process.env.NODE_ENV === "production";
  const cookieDomain = getCookieDomain();

  const clearOptions = {
    path: "/",
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    maxAge: 0,
    expires: new Date(0),
  };

  // 2. Comprehensive Cookie Invalidation across all possible domain levels
  if (cookieDomain) {
    response.cookies.set("ht_sso_token", "", { ...clearOptions, domain: cookieDomain });
    response.cookies.set("hut_access_token", "", { ...clearOptions, domain: cookieDomain });
    response.cookies.set("hut_refresh_token", "", { ...clearOptions, domain: cookieDomain });
  }

  // Host-only cookie invalidation
  response.cookies.set("ht_sso_token", "", clearOptions);
  response.cookies.set("hut_access_token", "", clearOptions);
  response.cookies.set("hut_refresh_token", "", clearOptions);
  response.cookies.set("hut_device_id", "", clearOptions);

  // Legacy cookies cleanup
  response.cookies.set("sb-access-token", "", clearOptions);
  response.cookies.set("sb-refresh-token", "", clearOptions);

  return response;
}

export async function POST(req: Request) {
  return performLogout(req);
}

export async function GET(req: Request) {
  const res = await performLogout(req);
  const ssoBase = getSsoUrl();
  const loginTarget = ssoBase
    ? `${ssoBase}/login?app=flashcard`
    : "/login?logout=true";
  return NextResponse.redirect(new URL(loginTarget, req.url), {
    headers: res.headers,
  });
}
