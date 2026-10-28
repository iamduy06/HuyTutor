import { NextResponse } from "next/server";
import { getApiUrl } from "@/lib/apiUrl";

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
  // Clear new HttpOnly cookies
  response.cookies.set("hut_access_token", "", { path: "/", maxAge: 0 });
  response.cookies.set("hut_refresh_token", "", { path: "/", maxAge: 0 });

  // Option B: Clean up legacy Supabase cookies if any
  response.cookies.set("sb-access-token", "", { path: "/", maxAge: 0 });
  response.cookies.set("sb-refresh-token", "", { path: "/", maxAge: 0 });

  return response;
}
