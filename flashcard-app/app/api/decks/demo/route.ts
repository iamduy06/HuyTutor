import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/services/supabase/server";
import { DEMO_CARD_LIMIT } from "@/lib/constants";
import { FlashcardContent } from "@/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const deckId = searchParams.get("deckId");

  if (!deckId) {
    return NextResponse.json({ error: "deckId required" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: deck } = await supabase
    .from("decks")
    .select("id, title, description, level")
    .eq("id", deckId)
    .single();

  if (!deck) return NextResponse.json({ error: "Deck not found" }, { status: 404 });

  // Separate query — NOT the full deck endpoint
  const { data: flashcards } = await supabase
    .from("flashcards")
    .select("content")
    .eq("deck_id", deckId)
    .limit(1);

  const firstUnit = flashcards?.[0]?.content as FlashcardContent | undefined;
  const cards = (firstUnit?.vocabulary ?? []).slice(0, DEMO_CARD_LIMIT);

  return NextResponse.json({ deck, cards });
}
