import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { deck_id, learned_count, progress_percent } = await request.json();
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("user_decks")
    .select("streak, last_studied_at")
    .eq("user_id", user.id)
    .eq("deck_id", deck_id)
    .single();

  let streak = (existing?.streak ?? 0);
  const lastStudied = existing?.last_studied_at ? new Date(existing.last_studied_at) : null;
  const today = new Date();
  const diffDays = lastStudied
    ? Math.floor((today.getTime() - lastStudied.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  if (diffDays === 1) streak += 1;
  else if (diffDays === null || diffDays > 1) streak = 1;

  const { error } = await admin.from("user_decks").upsert({
    user_id: user.id,
    deck_id,
    learned_count,
    progress_percent,
    streak,
    last_studied_at: today.toISOString(),
  }, { onConflict: "user_id,deck_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, streak });
}
