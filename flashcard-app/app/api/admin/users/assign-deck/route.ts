import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/services/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: appUser } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (appUser?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId, deckId, expiredAt } = await request.json();
  if (!userId || !deckId) return NextResponse.json({ error: "userId and deckId required" }, { status: 400 });

  const adminClient = createAdminClient();

  const { error } = await adminClient.from("user_decks").upsert(
    {
      user_id: userId,
      deck_id: deckId,
      expired_at: expiredAt ?? null,
      progress_percent: 0,
      learned_count: 0,
      streak: 0,
    },
    { onConflict: "user_id,deck_id" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
