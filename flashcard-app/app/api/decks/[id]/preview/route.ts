import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/services/supabase/admin";
import { extractTabs } from "@/lib/utils";
import type { FlashcardRow, Tab } from "@/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const adminSupabase = createAdminClient();

  // 1. Lấy thông tin deck để biết level và limit
  const { data: deck } = await adminSupabase
    .from("decks")
    .select("access_level, preview_word_limit")
    .eq("id", params.id)
    .single();

  if (!deck) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (deck.access_level !== "preview") {
    return NextResponse.json({ error: "This deck does not support preview" }, { status: 403 });
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

  // 3. Cắt nội dung tại backend
  let seen = 0;
  const previewTabs = allTabs.map(tab => {
    const remaining = limit - seen;
    if (remaining <= 0) return null;
    const vocab = (tab.vocabulary ?? []).slice(0, remaining);
    seen += vocab.length;
    return { ...tab, vocabulary: vocab };
  }).filter((t): t is Tab => t !== null && t.vocabulary.length > 0);

  return NextResponse.json({ tabs: previewTabs, isPreview: true });
}
