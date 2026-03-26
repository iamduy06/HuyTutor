import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/services/supabase/admin";
import { DEMO_CARD_LIMIT } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const deckId = searchParams.get("deckId");

  if (!deckId) {
    return NextResponse.json({ error: "deckId required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: deck, error: deckError } = await supabase
    .from("decks")
    .select("id, title, description, level")
    .eq("id", deckId)
    .single();

  if (deckError || !deck) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }

  // Dedicated demo query — never reuse full deck query
  const { data: cards, error } = await supabase
    .from("flashcards")
    .select("id, deck_id, content, order_index")
    .eq("deck_id", deckId)
    .order("order_index", { ascending: true })
    .limit(DEMO_CARD_LIMIT);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch demo cards" }, { status: 500 });
  }

  return NextResponse.json({
    deck,
    cards: cards ?? [],
    isDemo: true,
    total: cards?.length ?? 0,
  });
}
