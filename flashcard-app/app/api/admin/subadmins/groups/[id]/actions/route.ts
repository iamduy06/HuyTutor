import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";

async function checkAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users").select("role").eq("id", user.id).single();
  return data?.role === "ADMIN" ? user : null;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const supabase = createAdminClient();
  const { action } = body;

  // 1. Toggle Subadmin in group
  if (action === "toggle_subadmin") {
    const { user_id, is_subadmin } = body;
    const { error } = await supabase
      .from("group_users")
      .update({ is_subadmin })
      .eq("group_id", params.id)
      .eq("user_id", user_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // 2. Assign Deck to Group
  if (action === "assign_group_deck") {
    const { deck_id, expired_at } = body;
    const { error } = await supabase
      .from("group_decks")
      .upsert({
        group_id: params.id,
        deck_id,
        expired_at: expired_at?.trim() ? expired_at : null
      }, { onConflict: "group_id,deck_id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // 3. Revoke Deck from Group
  if (action === "revoke_group_deck") {
    const { deck_id } = body;
    const { error } = await supabase
      .from("group_decks")
      .delete()
      .eq("group_id", params.id)
      .eq("deck_id", deck_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // 4. Add Member (Exist)
  if (action === "add_member") {
    const { user_id } = body;
    
    // Check max_users limit before adding
    const [{ count }, { data: group }] = await Promise.all([
      supabase.from("group_users").select("*", { count: "exact", head: true }).eq("group_id", params.id),
      supabase.from("groups").select("max_users").eq("id", params.id).single()
    ]);

    if (count !== null && group !== null && count >= group.max_users) {
      return NextResponse.json({ error: "Nhóm đã đạt giới hạn thành viên (max_users)" }, { status: 400 });
    }

    const { error } = await supabase
      .from("group_users")
      .insert({ group_id: params.id, user_id, is_subadmin: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
