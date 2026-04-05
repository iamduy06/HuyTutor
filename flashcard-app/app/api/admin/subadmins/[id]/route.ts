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
    const { error } = await db.from("user_decks").upsert({
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
    const { error } = await db.from("user_decks")
      .delete()
      .eq("user_id", params.id)
      .eq("deck_id", body.deck_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
