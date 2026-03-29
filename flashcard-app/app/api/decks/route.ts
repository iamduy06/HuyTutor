import { NextResponse } from "next/server";
import { createAdminClient } from "@/services/supabase/admin";
import { normaliseUnits, countWords } from "@/lib/utils";
import type { FlashcardRow } from "@/types";

export async function GET() {
  const supabase = createAdminClient();

  const { data: decks, error: deckErr } = await supabase
    .from("decks")
    .select("id, title, description, level, created_at")
    .order("created_at", { ascending: true });

  if (deckErr) return NextResponse.json({ error: deckErr.message }, { status: 500 });

  // Fetch word counts per deck
  const { data: cards } = await supabase
    .from("flashcards")
    .select("deck_id, content");

  const wordCountMap: Record<string, number> = {};
  (cards ?? []).forEach((c) => {
    const row = c as unknown as FlashcardRow;
    wordCountMap[c.deck_id] = (wordCountMap[c.deck_id] ?? 0) + countWords(row);
  });

  const result = (decks ?? []).map((d) => ({
    ...d,
    word_count: wordCountMap[d.id] ?? 0,
  }));

  return NextResponse.json({ decks: result });
}
