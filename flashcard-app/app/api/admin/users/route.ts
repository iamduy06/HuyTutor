import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";
import { generatePassword } from "@/lib/utils";

async function checkAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (data?.role !== "ADMIN") return null;
  return user;
}

export async function GET() {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createAdminClient();
  const { data: users, error } = await supabase
    .from("users")
    .select(`*, user_decks(id, deck_id, expired_at, deck:decks(title)), creator:users!created_by(id, email, role)`)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { email, role = "USER" } = body;
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  // Dùng mật khẩu do admin nhập, hoặc tự tạo ngẫu nhiên nếu không nhập
  const password = body.password?.trim() || generatePassword(10);
  const supabase = createAdminClient();

  // Truyền role qua user_metadata → trigger handle_new_user sẽ đọc và set đúng
  // Admin tạo user → created_by = null (không cần set)
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role },
  });

  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

  // Trigger đã insert vào public.users với đúng role
  // Nếu cần ensure (phòng trigger chưa chạy kịp), upsert thêm
  const { error: upsertError } = await supabase.from("users").upsert({
    id: authUser.user.id,
    email,
    role,
    // created_by để null → admin tạo trực tiếp
  }, { onConflict: "id" });

  if (upsertError) {
    console.error("Profile upsert error:", upsertError.message);
    // Không return lỗi vì trigger đã tạo row cơ bản
  }

  return NextResponse.json({ user: authUser.user, tempPassword: password });
}
