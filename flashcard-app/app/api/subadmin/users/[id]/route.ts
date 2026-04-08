import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";
import { generatePassword } from "@/lib/utils";

async function checkSubAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users").select("*").eq("id", user.id).single();
  if (!data || (data.role !== "SUBADMIN" && data.role !== "ADMIN")) return null;
  return data;
}

async function canManage(me: any, targetId: string) {
  if (me.role === "ADMIN") return true;
  const admin = createAdminClient();
  
  // Kiểm tra xem targetId có nằm trong bất kỳ nhóm nào mà me.id là subadmin không
  const { data } = await admin
    .from("group_users")
    .select("group_id")
    .eq("user_id", me.id)
    .eq("is_subadmin", true);
  
  const myGroupIds = (data ?? []).map(g => g.group_id);
  if (myGroupIds.length === 0) return false;

  const { data: targetInGroup } = await admin
    .from("group_users")
    .select("group_id")
    .eq("user_id", targetId)
    .in("group_id", myGroupIds)
    .limit(1)
    .maybeSingle();

  return !!targetInGroup;
}

// PATCH: reset_password | assign_deck | revoke_deck | change_role | remove_device | reset_devices | change_max_devices
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const me = await checkSubAdmin();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const allowed = await canManage(me, params.id);
  if (!allowed) return NextResponse.json({ error: "Forbidden: Bạn không quản lý người dùng này" }, { status: 403 });

  const body = await request.json();
  const admin = createAdminClient();

  // 1. Reset Password
  if (body.action === "reset_password") {
    const pw = generatePassword(8);
    const { error } = await admin.auth.admin.updateUserById(params.id, { password: pw });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ tempPassword: pw });
  }

  // 2. Assign Deck (Ràng buộc kho Deck của Nhóm)
  if (body.action === "assign_deck") {
    const { deck_id, expired_at } = body;

    // SubAdmin chỉ được giao Deck có trong group_decks của nhóm mà user đích thuộc về
    const { data: userGroup } = await admin
      .from("group_users")
      .select("group_id")
      .eq("user_id", params.id)
      .limit(1)
      .single();

    if (!userGroup) return NextResponse.json({ error: "User không thuộc nhóm nào" }, { status: 400 });

    const { data: groupDeck } = await admin
      .from("group_decks")
      .select("expired_at")
      .eq("group_id", userGroup.group_id)
      .eq("deck_id", deck_id)
      .maybeSingle();

    if (!groupDeck) {
      return NextResponse.json({ error: "Bộ đề này không thuộc kho tài nguyên của nhóm" }, { status: 403 });
    }

    // Kiểm tra và validate expired_at không vượt quá hạn của nhóm
    let finalExpiredAt = expired_at;
    if (groupDeck.expired_at) {
      const gExp = new Date(groupDeck.expired_at);
      if (!expired_at) {
        finalExpiredAt = groupDeck.expired_at;
      } else {
        const uExp = new Date(expired_at);
        if (uExp > gExp) {
          return NextResponse.json({ error: `Hạn dùng không được vượt quá hạn của nhóm (${gExp.toLocaleString()})` }, { status: 400 });
        }
      }
    }

    const { error } = await admin.from("user_decks").upsert({
      user_id: params.id,
      deck_id,
      expired_at: finalExpiredAt || null,
      progress_percent: 0,
      learned_count: 0,
      streak: 0,
    }, { onConflict: "user_id,deck_id" });
    
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  // 3. Revoke Deck
  if (body.action === "revoke_deck") {
    const { error } = await admin.from("user_decks")
      .delete()
      .eq("user_id", params.id)
      .eq("deck_id", body.deck_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  // 4. Change Role (Toggle is_subadmin trong group_users)
  if (body.action === "change_role") {
    const { role } = body;
    // Cập nhật role chính
    const { error: roleErr } = await admin.from("users").update({ role }).eq("id", params.id);
    if (roleErr) return NextResponse.json({ error: roleErr.message }, { status: 400 });

    // Tìm nhóm chung giữa me và target để cập nhật is_subadmin
    const { data: meGroups } = await admin.from("group_users").select("group_id").eq("user_id", me.id).eq("is_subadmin", true);
    const myGIds = (meGroups ?? []).map(g => g.group_id);

    await admin.from("group_users")
      .update({ is_subadmin: (role === "SUBADMIN") })
      .eq("user_id", params.id)
      .in("group_id", myGIds);

    return NextResponse.json({ success: true });
  }

  // 5. Device Actions
  if (body.action === "remove_device") {
    const { error } = await admin.from("user_devices").delete().eq("user_id", params.id).eq("device_id", body.device_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  if (body.action === "reset_devices") {
    const { error } = await admin.from("user_devices").delete().eq("user_id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  if (body.action === "change_max_devices") {
    const { max_devices } = body;
    // Kiểm tra giới hạn của nhóm
    const { data: gu } = await admin.from("group_users").select("group_id").eq("user_id", params.id).limit(1).single();
    if (gu) {
      const { data: g } = await admin.from("groups").select("max_device_per_user").eq("id", gu.group_id).single();
      if (g && max_devices && max_devices > g.max_device_per_user) {
        return NextResponse.json({ error: `Giới hạn nhóm chỉ cho phép tối đa ${g.max_device_per_user} thiết bị/user` }, { status: 400 });
      }
    }

    const { error } = await admin.from("users").update({ max_devices: max_devices || null }).eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// DELETE: Clean delete user account
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const me = await checkSubAdmin();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const allowed = await canManage(me, params.id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
