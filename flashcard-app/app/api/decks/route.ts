import { NextResponse } from "next/server";
import { createAdminClient } from "@/services/supabase/admin";
import { extractTabs } from "@/lib/utils";
import type { FlashcardRow } from "@/types";

export async function GET() {
  const supabase = createAdminClient();

  const { data: decks, error } = await supabase
    .from("decks")
    .select("id, title, description, level, level_min, level_max, access_level, created_at")
    .in("access_level", ["public", "preview"])
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: cards } = await supabase
    .from("flashcards")
    .select("deck_id, content");

  const wordCountMap: Record<string, number> = {};
  (cards ?? []).forEach(c => {
    const tabs = extractTabs((c as unknown as FlashcardRow).content);
    const count = tabs.reduce((s, t) => s + (t.vocabulary?.length ?? 0), 0);
    wordCountMap[c.deck_id] = (wordCountMap[c.deck_id] ?? 0) + count;
  });

  const result = (decks ?? []).map((d: any) => ({
    ...d,
    word_count: wordCountMap[d.id] ?? 0,
    // Compute display level string
    level: computeLevelStr(d.level_min, d.level_max) ?? d.level,
  }));

  return NextResponse.json({ decks: result });
}

function computeLevelStr(min: string | null, max: string | null): string | null {
  if (!min && !max) return null;
  if (min && max && min !== max) return `${min} - ${max}`;
  return min ?? max;
}
