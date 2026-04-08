import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";
import { generatePassword } from "@/lib/utils";

async function checkAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users").select("role").eq("id", user.id).single();
  return data?.role === "ADMIN" ? user : null;
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const supabase = createAdminClient();

  // 1. Reset password
  if (body.action === "reset_password") {
    const newPassword = generatePassword(8);
    const { error } = await supabase.auth.admin.updateUserById(params.id, { password: newPassword });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ tempPassword: newPassword });
  }

  // 2. Assign deck
  if (body.action === "assign_deck") {
    const { deck_id, expired_at } = body;
    const expiredAtValue: string | null = expired_at?.trim() ? expired_at : null;
    const { error } = await supabase.from("user_decks").upsert({
      user_id: params.id,
      deck_id,
      expired_at: expiredAtValue,
      progress_percent: 0,
      learned_count: 0,
      streak: 0,
    }, { onConflict: "user_id,deck_id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  // 3. Change role & group & limit (Integrated Edit)
  if (body.action === "update_user") {
    const { role, group_id, max_managed_users, delete_user_ids, keep_user_ids } = body;
    const updates: any = {};
    if (role) updates.role = role;
    if (group_id !== undefined) updates.group_id = group_id === "NONE" ? null : group_id;
    if (max_managed_users !== undefined) updates.max_managed_users = max_managed_users;

    // Special Case: Downgrade from SUBADMIN to USER
    // The client should provide delete_user_ids / keep_user_ids if it's a downgrade
    if (delete_user_ids || keep_user_ids) {
      if (delete_user_ids?.length > 0) {
        for (const uid of delete_user_ids) {
          await supabase.auth.admin.deleteUser(uid);
        }
      }
      if (keep_user_ids?.length > 0) {
        await supabase.from("users").update({ group_id: null, created_by: null }).in("id", keep_user_ids);
      }
    }

    const { error: dbErr } = await supabase.from("users").update(updates).eq("id", params.id);
    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

    return NextResponse.json({ success: true, updates });
  }

  // Legacy actions (maintained for compatibility)
  if (body.action === "change_role") {
    const { role } = body;
    const { error: dbErr } = await supabase.from("users").update({ role }).eq("id", params.id);
    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (body.action === "revoke_deck") {
    const { deck_id } = body;
    const { error } = await supabase.from("user_decks").delete().eq("user_id", params.id).eq("deck_id", deck_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createAdminClient();
  
  // Try to parse body for managed user handling
  let deleteUserIds: string[] = [];
  let keepUserIds: string[] = [];
  try {
    const body = await request.json();
    deleteUserIds = body.delete_user_ids ?? [];
    keepUserIds = body.keep_user_ids ?? [];
  } catch (e) { /* ignore if no body */ }

  // 1. Handle managed users if any
  if (deleteUserIds.length > 0) {
    for (const uid of deleteUserIds) {
      await supabase.auth.admin.deleteUser(uid);
    }
  }
  if (keepUserIds.length > 0) {
    await supabase.from("users").update({ group_id: null, created_by: null }).in("id", keep_user_ids);
  }

  // 2. Delete the user
  const { error } = await supabase.auth.admin.deleteUser(params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  
  return NextResponse.json({ success: true });
}
