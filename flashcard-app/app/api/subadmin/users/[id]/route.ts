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
  // SubAdmin can only manage users they created
  const admin = createAdminClient();
  const { data } = await admin
    .from("users")
    .select("created_by")
    .eq("id", targetId)
    .single();
  return data?.created_by === me.id;
}

// PATCH: reset_password | assign_deck | revoke_deck | change_role
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const me = await checkSubAdmin();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const allowed = await canManage(me, params.id);
  if (!allowed) return NextResponse.json({ error: "Forbidden: not your user" }, { status: 403 });

  const body = await request.json();
  const admin = createAdminClient();

  if (body.action === "reset_password") {
    const pw = generatePassword(8);
    const { error } = await admin.auth.admin.updateUserById(params.id, { password: pw });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ tempPassword: pw });
  }

  if (body.action === "assign_deck") {
    const { deck_id, expired_at } = body;

    // SubAdmin can only assign decks they have access to
    if (me.role === "SUBADMIN") {
      const { data: myDeck } = await admin
        .from("user_decks")
        .select("id")
        .eq("user_id", me.id)
        .eq("deck_id", deck_id)
        .single();
      if (!myDeck) {
        return NextResponse.json({ error: "Bạn không có quyền giao bộ đề này" }, { status: 403 });
      }
    }

    const { error } = await admin.from("user_decks").upsert({
      user_id: params.id,
      deck_id,
      expired_at: expired_at || null,
      progress_percent: 0,
      learned_count: 0,
      streak: 0,
    }, { onConflict: "user_id,deck_id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  if (body.action === "revoke_deck") {
    const { error } = await admin.from("user_decks")
      .delete()
      .eq("user_id", params.id)
      .eq("deck_id", body.deck_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  if (body.action === "change_role") {
    const { role } = body;
    // SubAdmin can only toggle between USER and SUBADMIN
    if (me.role === "SUBADMIN" && role === "ADMIN") {
      return NextResponse.json({ error: "Không thể nâng lên ADMIN" }, { status: 403 });
    }
    const { error } = await admin.from("users").update({ role }).eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// DELETE: Remove user (subadmin can only delete their own users)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const me = await checkSubAdmin();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const allowed = await canManage(me, params.id);
  if (!allowed) return NextResponse.json({ error: "Forbidden: not your user" }, { status: 403 });

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
