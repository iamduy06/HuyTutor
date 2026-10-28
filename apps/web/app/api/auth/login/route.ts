import { NextResponse, type NextRequest } from "next/server";
import { getApiUrl } from "@/lib/apiUrl";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiUrl = getApiUrl();

    // SEC-014: Forward real client IP and device info
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
    if (clientIp) headers["x-forwarded-for"] = clientIp;
    if (body.device_id) headers["x-device-id"] = body.device_id;

    const res = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return NextResponse.json(data, { status: res.status });
    }

    const response = NextResponse.json(data);
    const isProd = process.env.NODE_ENV === "production";

    // Set HttpOnly SameSite cookie for Edge Middleware & Server Components
    if (data.session?.access_token) {
      response.cookies.set("hut_access_token", data.session.access_token, {
        path: "/",
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        maxAge: data.session.expires_in || 3600 * 24 * 7,
      });
    }

    if (data.session?.refresh_token) {
      response.cookies.set("hut_refresh_token", data.session.refresh_token, {
        path: "/",
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        maxAge: 3600 * 24 * 30, // 30 days
      });
    }

    return response;
  } catch (err: any) {
    console.error("[AUTH_LOGIN_PROXY_ERROR]", err);
    return NextResponse.json(
      { success: false, error: { code: "LOGIN_PROXY_ERROR", message: "Không thể kết nối tới máy chủ xác thực" } },
      { status: 500 }
    );
  }
}
