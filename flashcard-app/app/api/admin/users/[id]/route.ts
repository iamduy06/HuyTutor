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

  // 2. Assign deck (Super Admin Power)
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

  // 3. Update user details (Role, Group Reassignment)
  if (body.action === "update_user") {
    const { role, group_id, delete_user_ids, keep_user_ids } = body;
    
    // A. Update Role
    if (role) {
      const { error: dbErr } = await supabase.from("users").update({ role }).eq("id", params.id);
      if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
    }
    
    // B. Group Reassignment (Admin Power)
    if (group_id !== undefined) {
      const targetGroupId = (group_id === "NONE" || !group_id) ? ADMIN_MANAGED_GROUP_ID : group_id;
      
      // Delete old memberships
      await supabase.from("group_users").delete().eq("user_id", params.id);
      
      // Insert new membership
      const { error: gErr } = await supabase.from("group_users").insert({
        group_id: targetGroupId,
        user_id: params.id,
        is_subadmin: role === "SUBADMIN" || (await (async () => {
          const { data: u } = await supabase.from("users").select("role").eq("id", params.id).single();
          return u?.role === "SUBADMIN";
        })())
      });
      
      if (gErr) return NextResponse.json({ error: gErr.message }, { status: 500 });
    }

    // C. Handle Downgrade / Deletion cleanup
    if (delete_user_ids || keep_user_ids) {
      if (delete_user_ids?.length > 0) {
        for (const uid of (delete_user_ids as string[])) {
          await supabase.auth.admin.deleteUser(uid);
        }
      }
      if (keep_user_ids?.length > 0) {
        // Just move them to Admin Managed
        await supabase.from("group_users").delete().in("user_id", keep_user_ids);
        const memberships = (keep_user_ids as string[]).map(uid => ({ group_id: ADMIN_MANAGED_GROUP_ID, user_id: uid }));
        await supabase.from("group_users").insert(memberships);
      }
    }

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
  let deleteIds: string[] = [];
  let kIds: string[] = [];
  try {
    const body = await request.json();
    deleteIds = body.delete_user_ids ?? [];
    kIds = body.keep_user_ids ?? [];
  } catch (e) {}

  if (deleteIds.length > 0) {
    for (const uid of deleteIds) {
      await supabase.auth.admin.deleteUser(uid);
    }
  }
  if (kIds.length > 0) {
    // Move to Admin Managed before deleting subadmin
    await supabase.from("group_users").delete().in("user_id", kIds);
    const memberships = kIds.map(uid => ({ group_id: ADMIN_MANAGED_GROUP_ID, user_id: uid }));
    await supabase.from("group_users").insert(memberships);
  }

  const { error } = await supabase.auth.admin.deleteUser(params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
