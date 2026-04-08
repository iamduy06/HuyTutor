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
    .select(`
      *, 
      user_decks(id, deck_id, expired_at, deck:decks(title)), 
      creator:users!created_by(id, email, role),
      group:groups!group_id(id, name)
    `)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users });
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
  // If role is SUBADMIN and no group_id is provided, create a new group
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

  // 3. Update profile (ensure metadata and group_id are synced)
  const { error: upsertError } = await supabase.from("users").upsert({
    id: newUserId,
    email,
    role,
    group_id: finalGroupId,
  }, { onConflict: "id" });

  if (upsertError) {
    console.error("Profile upsert error:", upsertError.message);
  }

  return NextResponse.json({ user: authUser.user, tempPassword: password, group_id: finalGroupId });
}
