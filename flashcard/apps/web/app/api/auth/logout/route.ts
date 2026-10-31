import { NextResponse } from "next/server";
import { getApiUrl } from "@/lib/apiUrl";
import { getCookieDomain } from "@/lib/sso";

export async function POST(req: Request) {
  try {
    const apiUrl = getApiUrl();
    const token = req.headers.get("authorization");

    if (token) {
      await fetch(`${apiUrl}/auth/logout`, {
        method: "POST",
        headers: { Authorization: token },
      }).catch(() => {});
    }
  } catch {
    /* Ignore backend notification errors */
  }

  const response = NextResponse.json({ success: true });

  // Clear Master SSO cookie
  const cookieDomain = getCookieDomain();
  if (cookieDomain) {
    response.cookies.set("ht_sso_token", "", { domain: cookieDomain, path: "/", maxAge: 0 });
  }
  response.cookies.set("ht_sso_token", "", { path: "/", maxAge: 0 });

  // Clear local cookies
  response.cookies.set("hut_access_token", "", { path: "/", maxAge: 0 });
  response.cookies.set("hut_refresh_token", "", { path: "/", maxAge: 0 });

  // Clean up legacy cookies if any
  response.cookies.set("sb-access-token", "", { path: "/", maxAge: 0 });
  response.cookies.set("sb-refresh-token", "", { path: "/", maxAge: 0 });

  return response;
}
