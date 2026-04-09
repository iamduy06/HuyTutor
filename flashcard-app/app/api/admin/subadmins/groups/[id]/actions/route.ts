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

  // 1. Toggle Subadmin in group (with Global Role Sync)
  if (action === "toggle_subadmin") {
    const { user_id, is_subadmin } = body;
    
    // Step A: Update group_users status
    const { error: guError } = await supabase
      .from("group_users")
      .update({ is_subadmin })
      .eq("group_id", params.id)
      .eq("user_id", user_id);
    if (guError) return NextResponse.json({ error: guError.message }, { status: 500 });

    // Step B: Check if user is still a subadmin in ANY group
    const { data: otherGroups } = await supabase
      .from("group_users")
      .select("id")
      .eq("user_id", user_id)
      .eq("is_subadmin", true)
      .limit(1);

    const hasAnySubadminPrivilege = (otherGroups && otherGroups.length > 0);
    
    // Step C: Sync users.role
    const newRole = hasAnySubadminPrivilege ? "SUBADMIN" : "USER";
    const { error: roleError } = await supabase
      .from("users")
      .update({ role: newRole })
      .eq("id", user_id);
    
    if (roleError) console.error("[ROLE_SYNC_ERROR]", roleError);

    return NextResponse.json({ success: true, syncedRole: newRole });
  }

  // 2. Assign multiple Decks to Group (+ Optional auto-assign to users)
  if (action === "assign_group_deck") {
    const { deck_ids, expired_at, assign_all_users } = body;
    const finalExpiry = expired_at?.trim() ? expired_at : null;

    if (!Array.isArray(deck_ids) || deck_ids.length === 0) {
      return NextResponse.json({ error: "Chưa chọn bộ đề" }, { status: 400 });
    }

    // A. Upsert into group_decks
    const groupDeckRows = deck_ids.map(deck_id => ({
      group_id: params.id,
      deck_id,
      expired_at: finalExpiry
    }));

    const { error: gdError } = await supabase
      .from("group_decks")
      .upsert(groupDeckRows, { onConflict: "group_id,deck_id" });

    if (gdError) return NextResponse.json({ error: gdError.message }, { status: 500 });

    // B. If assign_all_users = true, sync to all existing members in user_decks
    if (assign_all_users) {
      const { data: members } = await supabase
        .from("group_users")
        .select("user_id")
        .eq("group_id", params.id);

      if (members && members.length > 0) {
        const userDeckRows: any[] = [];
        members.forEach(m => {
          deck_ids.forEach(dId => {
            userDeckRows.push({
              user_id: m.user_id,
              deck_id: dId,
              expired_at: finalExpiry
            });
          });
        });

        // Batch upsert into user_decks
        await supabase.from("user_decks").upsert(userDeckRows, { onConflict: "user_id,deck_id" });
      }
    }

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

  // 4. Move Member to another group
  if (action === "move_member") {
    const { user_id, target_group_id, clear_decks } = body;
    
    // Check if target group is system group (Admin can, but let's log it)
    const { data: targetGroup } = await supabase.from("groups").select("is_system").eq("id", target_group_id).single();
    
    // Transaction Start: Update group assignment
    const { error: moveError } = await supabase
      .from("group_users")
      .update({ group_id: target_group_id, is_subadmin: false }) // Reset subadmin on move
      .eq("user_id", user_id)
      .eq("group_id", params.id);
    
    if (moveError) return NextResponse.json({ error: moveError.message }, { status: 500 });

    // Optional: Clear old deck assignments
    if (clear_decks) {
      await supabase.from("user_decks").delete().eq("user_id", user_id);
    }

    return NextResponse.json({ success: true });
  }

  // 5. Add Member (Exist)
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
