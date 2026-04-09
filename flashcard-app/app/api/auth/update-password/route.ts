import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";

/**
 * API Bridge: Cập nhật mật khẩu bằng quyền Admin để tránh độ trễ SMTP (email confirmation).
 * Bảo mật: Chỉ cho phép người dùng đang đăng nhập đổi mật khẩu của chính họ.
 */
export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Mật khẩu tối thiểu 6 ký tự" }, { status: 400 });
    }

    // 1. Xác thực người dùng hiện tại từ session/cookie
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Sử dụng Admin Client để cập nhật mật khẩu (bypass SMTP delay)
    const adminClient = createAdminClient();
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      user.id,
      { password: password }
    );

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Mật khẩu đã được cập nhật nhanh chóng." });

  } catch (err: any) {
    console.error("[UPDATE_PASSWORD_API_ERROR]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
