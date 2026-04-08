import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/services/supabase/admin";
import { extractTabs } from "@/lib/utils";
import { DEMO_LIMIT } from "@/lib/constants";
import type { FlashcardRow, Tab } from "@/types";

export async function GET(req: NextRequest) {
  const deckId = req.nextUrl.searchParams.get("deckId");
  if (!deckId) return NextResponse.json({ error: "deckId required" }, { status: 400 });

  const supabase = createAdminClient();

  const { data: deck } = await supabase
    .from("decks")
    .select("id, title, description, level")
    .eq("id", deckId)
    .single();
  if (!deck) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: rows } = await supabase
    .from("flashcards")
    .select("id, deck_id, content, created_at")
    .eq("deck_id", deckId)
    .order("created_at", { ascending: true });

  const allTabs: Tab[] = (rows ?? []).flatMap(r =>
    extractTabs((r as unknown as FlashcardRow).content)
  );

  // Giới hạn DEMO_LIMIT từ
  let seen = 0;
  const demoTabs = allTabs.map(tab => {
    const remaining = DEMO_LIMIT - seen;
    if (remaining <= 0) return null;
    const vocab = (tab.vocabulary ?? []).slice(0, remaining);
    seen += vocab.length;
    return { ...tab, vocabulary: vocab };
  }).filter((t): t is Tab => t !== null && t.vocabulary.length > 0);

  return NextResponse.json({ deck, tabs: demoTabs, isDemo: true });
}
