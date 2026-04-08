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

  // 1. Get all users
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select(`
      *, 
      user_decks(id, deck_id, expired_at, deck:decks(title)), 
      group:groups!group_id(id, name, owner_id)
    `)
    .order("created_at", { ascending: false });

  if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 });

  // 2. Get all groups to calculate capacity
  const { data: groups, error: groupsError } = await supabase
    .from("groups")
    .select("*");

  if (groupsError) return NextResponse.json({ error: groupsError.message }, { status: 500 });

  // 3. For each group, calculate current users and find the owner's limit
  const groupStats = await Promise.all(
    (groups ?? []).map(async (g: any) => {
      // Current count (all users in this group)
      const { count } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("group_id", g.id);

      // Max limit (from the owner subadmin)
      let maxLimit = 10;
      if (g.owner_id) {
        const { data: owner } = await supabase
          .from("users")
          .select("max_managed_users")
          .eq("id", g.owner_id)
          .single();
        if (owner) maxLimit = owner.max_managed_users;
      }

      return {
        id: g.id,
        current_count: count ?? 0,
        max_limit: maxLimit
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

  // 1. Create user in Auth
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role, group_id },
  });

  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

  const newUserId = authUser.user.id;
  let finalGroupId = group_id;

  // 2. Special logic for SUBADMIN Root creation
  if (role === "SUBADMIN" && !finalGroupId) {
    const { data: newGroup, error: groupErr } = await supabase
      .from("groups")
      .insert({
        name: group_name || `Nhóm của ${email}`,
        owner_id: newUserId
      })
      .select()
      .single();
    
    if (!groupErr) {
      finalGroupId = newGroup.id;
    }
  }

  // 3. Update profile
  const { error: upsertError } = await supabase.from("users").upsert({
    id: newUserId,
    email,
    role,
    group_id: finalGroupId,
    max_managed_users: role === "SUBADMIN" ? 10 : null // Default limit
  }, { onConflict: "id" });

  if (upsertError) {
    console.error("Profile upsert error:", upsertError.message);
  }

  return NextResponse.json({ user: authUser.user, tempPassword: password, group_id: finalGroupId });
}
