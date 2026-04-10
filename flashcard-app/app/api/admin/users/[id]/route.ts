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

  // Reset password
  if (body.action === "reset_password") {
    const newPassword = generatePassword(8);
    const { error } = await supabase.auth.admin.updateUserById(params.id, { password: newPassword });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ tempPassword: newPassword });
  }

  // Change info (role, max_devices)
  if (body.action === "change_info") {
    const { role, max_devices } = body;
    // Prevent self-demotion
    if (params.id === admin.id && role && role !== "ADMIN") {
      return NextResponse.json({ error: "Không thể tự xoá quyền Admin của chính mình" }, { status: 400 });
    }
    const updateData: any = {};
    if (role) {
      if (!["USER", "SUBADMIN", "ADMIN"].includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      updateData.role = role;
    }
    if (max_devices !== undefined) updateData.max_devices = max_devices;

    const { error: dbErr } = await supabase.from("users").update(updateData).eq("id", params.id);
    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
    return NextResponse.json({ success: true, updateData });
  }

  // Assign Group
  if (body.action === "assign_group") {
    const { group_id } = body;
    // First remove existing group(because a user belongs to 1 group max based on requirements)
    await supabase.from("group_users").delete().eq("user_id", params.id);
    if (group_id) {
      const { error } = await supabase.from("group_users").insert({
        group_id,
        user_id: params.id,
        is_subadmin: false // Default to false when assigned
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  // Assign deck (with optional progress_percent, learned_count)
  if (body.action === "assign_deck") {
    const { deck_id, expired_at, progress_percent = 0, learned_count = 0 } = body;
    const expiredAtValue: string | null = expired_at?.trim() ? expired_at : null;

    const { error } = await supabase.from("user_decks").upsert({
      user_id: params.id,
      deck_id,
      expired_at: expiredAtValue,
      progress_percent,
      learned_count,
      streak: 0,
    }, { onConflict: "user_id,deck_id" });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  // Update deck progress / expiry
  if (body.action === "update_deck_progress") {
    const { deck_id, progress_percent, learned_count, expired_at } = body;
    const updateData: any = {};
    if (progress_percent !== undefined) updateData.progress_percent = progress_percent;
    if (learned_count !== undefined) updateData.learned_count = learned_count;
    if (expired_at !== undefined) updateData.expired_at = expired_at?.trim() ? expired_at : null;

    const { error } = await supabase.from("user_decks")
      .update(updateData).eq("user_id", params.id).eq("deck_id", deck_id);
    
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  // Revoke deck
  if (body.action === "revoke_deck") {
    const { deck_id } = body;
    const { error } = await supabase.from("user_decks")
      .delete().eq("user_id", params.id).eq("deck_id", deck_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  // Manage Devices
  if (body.action === "remove_device") {
    const { device_id } = body;
    await supabase.from("user_devices").delete().eq("user_id", params.id).eq("device_id", device_id);
    // Ideally we could invalidate the specific token, but Supabase doesn't support that easily via Admin api. 
    // We invalidate all sessions to force re-auth
    await supabase.auth.admin.signOut(params.id);
    return NextResponse.json({ success: true });
  }

  if (body.action === "reset_devices") {
    await supabase.from("user_devices").delete().eq("user_id", params.id);
    await supabase.auth.admin.signOut(params.id);
    return NextResponse.json({ success: true });
  }

  // Bulk update expiry for all assigned decks
  if (body.action === "bulk_update_expiry") {
    const { expired_at } = body;
    const expiredAtValue: string | null = expired_at?.trim() ? expired_at : null;

    const { error } = await supabase.from("user_decks")
      .update({ expired_at: expiredAtValue })
      .eq("user_id", params.id);
    
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.deleteUser(params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
