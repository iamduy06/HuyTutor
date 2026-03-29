import { NextResponse } from "next/server";
import { createAdminClient } from "@/services/supabase/admin";
import { extractTabs } from "@/lib/utils";
import type { FlashcardRow } from "@/types";

export async function GET() {
  const supabase = createAdminClient();

  const { data: decks, error } = await supabase
    .from("decks")
    .select("id, title, description, level, created_at")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Lấy word count cho mỗi deck
  const { data: cards } = await supabase
    .from("flashcards")
    .select("deck_id, content");

  const wordCountMap: Record<string, number> = {};
  (cards ?? []).forEach(c => {
    const tabs = extractTabs((c as unknown as FlashcardRow).content);
    const count = tabs.reduce((s, t) => s + (t.vocabulary?.length ?? 0), 0);
    wordCountMap[c.deck_id] = (wordCountMap[c.deck_id] ?? 0) + count;
  });

  const result = (decks ?? []).map(d => ({
    ...d,
    word_count: wordCountMap[d.id] ?? 0,
  }));

  return NextResponse.json({ decks: result });
}
