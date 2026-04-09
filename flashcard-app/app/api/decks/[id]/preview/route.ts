import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/services/supabase/admin";
import { extractTabs } from "@/lib/utils";
import type { FlashcardRow, Tab } from "@/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const adminSupabase = createAdminClient();

  // 1. Lấy thông tin deck và giới hạn preview
  const { data: deck, error: deckError } = await adminSupabase
    .from("decks")
    .select("id, preview_word_limit")
    .eq("id", params.id)
    .single();

  if (deckError || !deck) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }

  const limit = deck.preview_word_limit || 10;

  // 2. Lấy content
  const { data: rows } = await adminSupabase
    .from("flashcards")
    .select("content, created_at")
    .eq("deck_id", params.id)
    .order("created_at", { ascending: true });

  const allTabs: Tab[] = (rows ?? []).flatMap(r =>
    extractTabs((r as unknown as FlashcardRow).content)
  );

  // 3. Slice vobabulary dựa trên giới hạn preview
  let count = 0;
  const slicedTabs: Tab[] = [];

  for (const tab of allTabs) {
    if (count >= limit) break;
    
    const remaining = limit - count;
    const items = tab.vocabulary.slice(0, remaining);
    
    slicedTabs.push({
      ...tab,
      vocabulary: items
    });
    
    count += items.length;
  }

  return NextResponse.json({ 
    tabs: slicedTabs, 
    isFull: false, 
    previewLimit: limit,
    totalActualWords: allTabs.reduce((s, t) => s + t.vocabulary.length, 0)
  });
}
