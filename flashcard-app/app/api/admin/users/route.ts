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
    .select(`*, user_decks(*, deck:decks(title))`)
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

  // Dùng mật khẩu do admin nhập, hoặc tự tạo nếu không nhập
  const password = body.password?.trim() || generatePassword(10);
  const supabase = createAdminClient();

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

  const { error: profileError } = await supabase.from("users").insert({
    id: authUser.user.id,
    email,
    role,
  });

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  return NextResponse.json({ user: authUser.user, tempPassword: password });
}
