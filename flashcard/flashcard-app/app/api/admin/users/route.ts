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
      user_decks(id, deck_id, expired_at, progress_percent, learned_count, deck:decks(title)), 
      group_users(group_id, is_subadmin, group:groups(name)),
      user_devices(id, device_id, device_name, ip_address, last_seen)
    `)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { email, role = "USER", max_devices, group_id, auto_assign_group_decks } = body;
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const password = body.password?.trim() || "goidangkyflashcard";
  const supabase = createAdminClient();

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { 
      role,
      created_by_admin: true,
      skip_system_group: !!(group_id && group_id !== "none")
    },
  });

  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

  // Update max_devices to users table if provided
  if (max_devices !== undefined && max_devices !== null && max_devices !== '') {
    const { error: upsertError } = await supabase.from("users").upsert({
      id: authUser.user.id,
      email,
      role,
      max_devices: parseInt(max_devices),
    }, { onConflict: "id" });
    if (upsertError) console.error("Profile upsert error:", upsertError.message);
  }

  // Assign to group if group_id provided
  if (group_id && group_id !== "none") {
    await supabase.from("group_users").insert({
      group_id,
      user_id: authUser.user.id,
      is_subadmin: false
    });

    if (auto_assign_group_decks) {
      const { data: groupDecks } = await supabase.from("group_decks").select("deck_id, expired_at").eq("group_id", group_id);
      if (groupDecks && groupDecks.length > 0) {
        const deckInserts = groupDecks.map((d: any) => ({
          user_id: authUser.user.id,
          deck_id: d.deck_id,
          expired_at: d.expired_at,
          progress_percent: 0,
          learned_count: 0
        }));
        const { error: assignError } = await supabase.from("user_decks").insert(deckInserts);
        if (assignError) console.error("Auto assign decks error:", assignError.message);
      }
    }
  }

  return NextResponse.json({ user: authUser.user, tempPassword: password });
}
