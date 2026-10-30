import { NextResponse, type NextRequest } from "next/server";
import { getApiUrl } from "@/lib/apiUrl";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiUrl = getApiUrl();

    const res = await fetch(`${apiUrl}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return NextResponse.json(data, { status: res.status });
    }

    const response = NextResponse.json(data);
    const isProd = process.env.NODE_ENV === "production";

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
        maxAge: 3600 * 24 * 30,
      });
    }

    return response;
  } catch (err: any) {
    console.error("[AUTH_VERIFY_OTP_PROXY_ERROR]", err);
    return NextResponse.json(
      { success: false, error: { code: "OTP_PROXY_ERROR", message: "Không thể xác thực mã OTP" } },
      { status: 500 }
    );
  }
}
