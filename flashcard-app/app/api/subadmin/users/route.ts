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

// GET: List users from groups managed by this subadmin
export async function GET() {
  const me = await checkSubAdmin();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();

  // 1. Tìm các nhóm mà user này là subadmin
  const { data: managedGroups } = await admin
    .from("group_users")
    .select("group_id, groups(id, name, max_users, max_device_per_user)")
    .eq("user_id", me.id)
    .eq("is_subadmin", true);

  const groupIds = (managedGroups ?? []).map(g => g.group_id);

  if (me.role !== "ADMIN" && groupIds.length === 0) {
    return NextResponse.json({ users: [], me: { ...me, current_managed: 0, max_managed_users: 0 } });
  }

  // 2. Lấy tất cả user thuộc các group này
  let userQuery = admin
    .from("users")
    .select("id, email, role, created_at, max_devices, user_decks(id, deck_id, expired_at, learned_count, progress_percent, streak, deck:decks(title))")
    .order("created_at", { ascending: false });

  if (me.role !== "ADMIN") {
    // Chỉ lấy user có trong group_users của các groupIds
    const { data: groupMemberIds } = await admin
      .from("group_users")
      .select("user_id")
      .in("group_id", groupIds);
    
    const memberIds = Array.from(new Set((groupMemberIds ?? []).map(m => m.user_id)));
    userQuery = userQuery.in("id", memberIds);
  }

  const { data: users, error } = await userQuery;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const totalMax = (managedGroups ?? []).reduce((acc, g: any) => acc + (g.groups?.max_users ?? 0), 0);

  return NextResponse.json({
    users: users ?? [],
    managed_groups: managedGroups ?? [],
    me: {
      id: me.id,
      email: me.email,
      role: me.role,
      max_managed_users: totalMax,
      current_managed: users?.length || 0,
    },
  });
}

// POST: Create user and add to group
export async function POST(request: NextRequest) {
  const me = await checkSubAdmin();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { email, role = "USER", password: customPw, group_id } = await request.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const admin = createAdminClient();

  // 1. Xác định group_id nếu chưa có (lấy group đầu tiên nếu chỉ quản lý 1 nhóm)
  let targetGroupId = group_id;
  if (!targetGroupId) {
    const { data: managed } = await admin
      .from("group_users")
      .select("group_id")
      .eq("user_id", me.id)
      .eq("is_subadmin", true)
      .limit(1);
    if (managed && managed.length > 0) targetGroupId = managed[0].group_id;
  }

  if (!targetGroupId && me.role !== "ADMIN") {
    return NextResponse.json({ error: "Bạn không quản lý nhóm nào để thêm thành viên" }, { status: 403 });
  }

  // 2. Kiểm tra giới hạn của nhóm
  if (me.role !== "ADMIN") {
    const { data: group } = await admin.from("groups").select("max_users").eq("id", targetGroupId).single();
    const { count } = await admin.from("group_users").select("*", { count: "exact", head: true }).eq("group_id", targetGroupId);
    
    if (group && count !== null && count >= group.max_users) {
      return NextResponse.json({ error: "Nhóm đã đạt giới hạn thành viên tối đa" }, { status: 403 });
    }
  }

  const password = customPw?.trim() || generatePassword(10);

  // 3. Tạo Auth User
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { 
      role,
      skip_system_group: true
    }
  });

  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

  // 4. Upsert Profile và Group Membership
  const userId = authUser.user.id;
  
  await Promise.all([
    admin.from("users").upsert({ id: userId, email, role }, { onConflict: "id" }),
    admin.from("group_users").insert({ group_id: targetGroupId, user_id: userId, is_subadmin: false })
  ]);

  return NextResponse.json({ user: authUser.user, tempPassword: password });
}
