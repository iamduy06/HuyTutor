import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getApiUrl } from "@/lib/apiUrl";
import { getCookieDomainList, getSsoUrl } from "@/lib/sso";

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
  const host = req.headers.get("host");
  const domainList = getCookieDomainList(host);

  const clearOptions = {
    path: "/",
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    maxAge: 0,
    expires: new Date(0),
  };

  const cookieNames = [
    "ht_sso_token",
    "hut_access_token",
    "hut_refresh_token",
    "hut_device_id",
    "sb-access-token",
    "sb-refresh-token",
  ];

  // 2. Comprehensive Cookie Invalidation across all possible domain levels
  // Use response.headers.append('Set-Cookie', ...) to guarantee all domain variations are sent
  // without Next.js response.cookies map overriding them
  const pastDate = "Thu, 01 Jan 1970 00:00:00 GMT";
  const secureFlag = isProd ? "; Secure" : "";

  for (const name of cookieNames) {
    // Host-only cookie invalidation
    response.headers.append(
      "Set-Cookie",
      `${name}=; Path=/; Expires=${pastDate}; Max-Age=0; HttpOnly${secureFlag}; SameSite=Lax`
    );

    // Domain-scoped cookie invalidation
    for (const dom of domainList) {
      if (dom) {
        response.headers.append(
          "Set-Cookie",
          `${name}=; Path=/; Domain=${dom}; Expires=${pastDate}; Max-Age=0; HttpOnly${secureFlag}; SameSite=Lax`
        );
      }
    }
  }

  return response;
}

export async function POST(req: Request) {
  return performLogout(req);
}

export async function GET(req: Request) {
  const res = await performLogout(req);
  return NextResponse.redirect(new URL("/?logout=true", req.url), {
    headers: res.headers,
  });
}
