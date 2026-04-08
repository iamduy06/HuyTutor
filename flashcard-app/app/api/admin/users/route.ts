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

  // 1. Get all users with their decks and group info
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select(`
      *, 
      user_decks(id, deck_id, expired_at, deck:decks(title)), 
      group:groups!group_id(id, name, owner_id)
    `)
    .order("created_at", { ascending: false });

  if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 });

  // 2. Get all groups with their max_users limit
  const { data: groups, error: groupsError } = await supabase
    .from("groups")
    .select("id, name, owner_id, max_users")
    .order("created_at", { ascending: true });

  if (groupsError) return NextResponse.json({ error: groupsError.message }, { status: 500 });

  // 3. For each group, calculate current user count
  const groupStats = await Promise.all(
    (groups ?? []).map(async (g: any) => {
      const { count } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("group_id", g.id);

      return {
        id: g.id,
        name: g.name,
        current_count: count ?? 0,
        max_limit: g.max_users ?? 10
      };
    })
  );

  return NextResponse.json({ 
    users, 
    groupStats 
  });
}

export async function POST(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { email, role = "USER", group_id, group_name } = body;
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const password = body.password?.trim() || generatePassword(10);
  const supabase = createAdminClient();

  // 1. Quota Check
  if (group_id && group_id !== "NONE") {
    const { data: group } = await supabase.from("groups").select("max_users").eq("id", group_id).single();
    const { count } = await supabase.from("users").select("*", { count: "exact", head: true }).eq("group_id", group_id);
    
    if ((count ?? 0) >= (group?.max_users ?? 10)) {
       return NextResponse.json({ error: "Nhóm đã đạt hạn mức tài khoản (Quota Full)" }, { status: 403 });
    }
  }

  // 2. Create user in Auth
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role, group_id },
  });

  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

  const newUserId = authUser.user.id;
  let finalGroupId = group_id === "NONE" ? null : group_id;

  // 3. Special logic for SUBADMIN Root creation
  if (role === "SUBADMIN" && !finalGroupId) {
    const { data: newGroup, error: groupErr } = await supabase
      .from("groups")
      .insert({
        name: group_name || `Nhóm của ${email}`,
        owner_id: newUserId,
        max_users: 10 // Default
      })
      .select()
      .single();
    
    if (!groupErr) {
      finalGroupId = newGroup.id;
    }
  }

  // 4. Update profile
  const { error: upsertError } = await supabase.from("users").upsert({
    id: newUserId,
    email,
    role,
    group_id: finalGroupId
  }, { onConflict: "id" });

  if (upsertError) {
    console.error("Profile upsert error:", upsertError.message);
  }

  return NextResponse.json({ user: authUser.user, tempPassword: password, group_id: finalGroupId });
}
