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

  // Assign deck
  if (body.action === "assign_deck") {
    const { deck_id, expired_at } = body;

    // expired_at = "" hoặc không có → null = không hết hạn (học mãi mãi)
    const expiredAtValue: string | null = expired_at?.trim() ? expired_at : null;

    const { error } = await supabase.from("user_decks").upsert({
      user_id: params.id,
      deck_id,
      expired_at: expiredAtValue,   // null = unlimited access
      progress_percent: 0,
      learned_count: 0,
      streak: 0,
    }, { onConflict: "user_id,deck_id" });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  // Change role
  if (body.action === "change_role") {
    const { role } = body;
    if (!["USER", "ADMIN"].includes(role))
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    // Update public.users table
    const { error: dbErr } = await supabase.from("users")
      .update({ role }).eq("id", params.id);
    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
    return NextResponse.json({ success: true, role });
  }

  // Revoke deck
  if (body.action === "revoke_deck") {
    const { deck_id } = body;
    const { error } = await supabase.from("user_decks")
      .delete().eq("user_id", params.id).eq("deck_id", deck_id);
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
