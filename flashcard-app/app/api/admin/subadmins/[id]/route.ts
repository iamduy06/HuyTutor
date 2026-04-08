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

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const db   = createAdminClient();

  if (body.action === "set_limit") {
    const { error } = await db
      .from("users")
      .update({ max_managed_users: body.max_managed_users })
      .eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (body.action === "assign_deck") {
    const { deck_id, expired_at } = body;
    const expVal = expired_at?.trim() || null;

    // Assign (or update expiry) for the subadmin themselves
    const { error } = await db.from("user_decks").upsert({
      user_id: params.id,
      deck_id,
      expired_at: expVal,
      progress_percent: 0,
      learned_count: 0,
      streak: 0,
    }, { onConflict: "user_id,deck_id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Fix 4: Cascade expiry update to all users managed by this subadmin
    // who also have access to this deck (granted by this subadmin, not admin-direct)
    // We update their expired_at to match the subadmin's new expiry
    const { data: managedUsers } = await db
      .from("users")
      .select("id")
      .eq("created_by", params.id);

    if (managedUsers && managedUsers.length > 0) {
      const userIds = managedUsers.map((u: { id: string }) => u.id);
      // Update expired_at for managed users who have this deck
      await db.from("user_decks")
        .update({ expired_at: expVal })
        .eq("deck_id", deck_id)
        .in("user_id", userIds);
      // Note: only updates existing rows, doesn't grant new access
    }

    return NextResponse.json({ success: true });
  }

  if (body.action === "revoke_deck") {
    const { deck_id } = body;

    // Fix 3: Cascade revoke to all users managed by this subadmin
    const { data: managedUsers } = await db
      .from("users")
      .select("id")
      .eq("created_by", params.id);

    if (managedUsers && managedUsers.length > 0) {
      const userIds = managedUsers.map((u: { id: string }) => u.id);
      // Remove deck access from all managed users
      await db.from("user_decks")
        .delete()
        .eq("deck_id", deck_id)
        .in("user_id", userIds);
    }

    // Then revoke from the subadmin themselves
    const { error } = await db.from("user_decks")
      .delete()
      .eq("user_id", params.id)
      .eq("deck_id", deck_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = createAdminClient();
  const body = await request.json().catch(() => ({}));
  
  const { 
    new_owner_id, 
    keep_user_ids = [], 
    delete_user_ids = [] 
  } = body;

  // 1. Handle Group Ownership Transfer
  // Check if this subadmin owns any groups
  const { data: ownedGroups } = await db
    .from("groups")
    .select("id")
    .eq("owner_id", params.id);

  if (ownedGroups && ownedGroups.length > 0) {
    for (const group of ownedGroups) {
      if (new_owner_id) {
        // Transfer group ownership to another subadmin
        await db.from("groups")
          .update({ owner_id: new_owner_id })
          .eq("id", group.id);
      } else {
        // No new owner -> Group becomes a "Virtual Group" managed by Admin
        await db.from("groups")
          .update({ owner_id: null })
          .eq("id", group.id);
      }
    }
  }

  // 2. Handle Managed Users
  // Users to delete
  if (delete_user_ids.length > 0) {
    for (const uid of delete_user_ids) {
      await db.auth.admin.deleteUser(uid);
    }
  }

  // Users to keep (convert to Admin-managed)
  if (keep_user_ids.length > 0) {
    await db.from("users")
      .update({ group_id: null })
      .in("id", keep_user_ids);
  }

  // 3. Delete the subadmin
  const { error } = await db.auth.admin.deleteUser(params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
