import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/services/supabase/server";
import { normalizeUnits, RawFlashcardContent } from "@/types";
import { DEMO_LIMIT } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const deckId = new URL(request.url).searchParams.get("deckId");
  if (!deckId) return NextResponse.json({ error: "deckId required" }, { status: 400 });

  const supabase = await createClient();

  const { data: deck } = await supabase
    .from("decks")
    .select("id, title, description, level")
    .eq("id", deckId)
    .single();

  if (!deck) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Dedicated demo query — never reuse full-deck endpoint
  const { data: flashcards } = await supabase
    .from("flashcards")
    .select("content")
    .eq("deck_id", deckId)
    .limit(1);

  const raw = flashcards?.[0]?.content as RawFlashcardContent | undefined;
  const cards = raw
    ? normalizeUnits(raw).flatMap((u) => u.vocabulary ?? []).slice(0, DEMO_LIMIT)
    : [];

  return NextResponse.json({ deck, cards });
}
