import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";
import { generatePassword } from "@/lib/utils";

async function checkSubAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users").select("*").eq("id", user.id).single();
  if (!data || (data.role !== "SUBADMIN" && data.role !== "ADMIN")) return null;
  return data;
}

// GET: List users in the same group
export async function GET() {
  const me = await checkSubAdmin();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();

  let query = admin
    .from("users")
    .select("id, email, role, created_at, created_by, group_id, user_decks(id, deck_id, expired_at, deck:decks(title))")
    .order("created_at", { ascending: false });

  if (me.role === "SUBADMIN") {
    const groupId = me.group_id;
    if (!groupId) return NextResponse.json({ error: "SubAdmin không thuộc nhóm nào. Vui lòng liên hệ Admin." }, { status: 403 });
    query = query.eq("group_id", groupId);
  }

  const { data: users, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get Group Info (Quota)
  let maxUsers = 10;
  if (me.role === "SUBADMIN" && me.group_id) {
    const { data: group } = await admin.from("groups").select("max_users").eq("id", me.group_id).single();
    if (group) maxUsers = group.max_users;
  }

  return NextResponse.json({
    users: users ?? [],
    me: {
      id: me.id,
      email: me.email,
      role: me.role,
      group_id: me.group_id,
      max_users: maxUsers,
      current_count: (users ?? []).length,
    },
  });
}

// POST: Create user under this group quota
export async function POST(request: NextRequest) {
  const me = await checkSubAdmin();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { email, role = "USER", password: customPw } = await request.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  if (!["USER", "SUBADMIN"].includes(role)) {
    return NextResponse.json({ error: "SubAdmin không thể tạo ADMIN" }, { status: 403 });
  }

  const admin = createAdminClient();
  const rootGroupId = me.group_id;
  if (!rootGroupId && me.role === "SUBADMIN") {
    return NextResponse.json({ error: "SubAdmin không thuộc nhóm nào" }, { status: 403 });
  }

  // 1. Quota Check (Group Level)
  if (me.role === "SUBADMIN") {
    // Total users in group
    const { count } = await admin
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("group_id", rootGroupId);

    // Get group max_users
    const { data: group } = await admin.from("groups").select("max_users").eq("id", rootGroupId).single();
    const max = group?.max_users ?? 10;

    if ((count ?? 0) >= max) {
      return NextResponse.json(
        { error: `Nhóm đã đạt giới hạn ${max} tài khoản. Liên hệ Admin để nâng cấp gói.` },
        { status: 403 }
      );
    }
  }

  const password = customPw?.trim() || generatePassword(10);

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role,
      created_by: me.id,
      group_id: rootGroupId,
    },
  });

  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

  const { error: upsertError } = await admin.from("users").upsert({
    id: authUser.user.id,
    email,
    role,
    created_by: me.id,
    group_id: rootGroupId,
  }, { onConflict: "id" });

  if (upsertError) {
    console.error("Profile upsert error:", upsertError.message);
  }

  return NextResponse.json({ user: authUser.user, tempPassword: password });
}
