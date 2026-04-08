import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";
import { generatePassword } from "@/lib/utils";

const ADMIN_MANAGED_GROUP_ID = "da000000-0000-0000-0000-000000000000";

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

  // 1. Get all users with their group association via group_users
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select(`
      *, 
      user_decks(id, deck_id, expired_at, deck:decks(title)),
      memberships:group_users(
        is_subadmin,
        group:groups(id, name)
      )
    `)
    .order("created_at", { ascending: false });

  if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 });

  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { email, role = "USER", group_id } = body;
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const password = body.password?.trim() || generatePassword(10);
  const supabase = createAdminClient();

  // 1. Create user in Auth
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role },
  });

  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

  const newUserId = authUser.user.id;

  // 2. Update profile
  const { error: upsertError } = await supabase.from("users").upsert({
    id: newUserId,
    email,
    role
  }, { onConflict: "id" });

  if (upsertError) {
    console.error("Profile upsert error:", upsertError.message);
  }

  // 3. Handle Group Assignment
  // If role is ADMIN or if no group is specified, assign to ADMIN_MANAGED
  let targetGroupId = group_id && group_id !== "NONE" ? group_id : ADMIN_MANAGED_GROUP_ID;
  if (role === "ADMIN") targetGroupId = ADMIN_MANAGED_GROUP_ID;

  const { error: groupError } = await supabase.from("group_users").insert({
    group_id: targetGroupId,
    user_id: newUserId,
    is_subadmin: role === "SUBADMIN"
  });

  if (groupError) {
    console.error("Group assignment error:", groupError.message);
  }

  return NextResponse.json({ user: authUser.user, tempPassword: password });
}
