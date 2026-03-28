import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/services/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";
import { DEMO_CARD_LIMIT } from "@/lib/constants";
import { isExpired } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const adminSupabase = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: deck } = await adminSupabase
    .from("decks")
    .select("id, title, description, level")
    .eq("id", params.id)
    .single();

  if (!deck) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }

  // Check user_decks for expiry
  const { data: userDeck } = await adminSupabase
    .from("user_decks")
    .select("expired_at, progress_percent, learned_count, streak")
    .eq("user_id", user.id)
    .eq("deck_id", params.id)
    .single();

  const hasAccess = userDeck && !isExpired(userDeck.expired_at);
  const limit = hasAccess ? undefined : DEMO_CARD_LIMIT;

  let query = adminSupabase
    .from("flashcards")
    .select("id, deck_id, content, order_index")
    .eq("deck_id", params.id)
    .order("order_index", { ascending: true });

  if (limit) {
    query = query.limit(limit);
  }

  const { data: cards, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Failed to fetch cards" }, { status: 500 });
  }

  return NextResponse.json({
    deck,
    cards: cards ?? [],
    isDemo: !hasAccess,
    userDeck: userDeck ?? null,
    total: cards?.length ?? 0,
  });
}
