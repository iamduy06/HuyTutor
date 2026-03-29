import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";
import { extractTabs, hasFullAccess } from "@/lib/utils";
import { DEMO_LIMIT } from "@/lib/constants";
import type { FlashcardRow, Tab } from "@/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase      = createClient();
  const adminSupabase = createAdminClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Deck info
  const { data: deck } = await adminSupabase
    .from("decks")
    .select("id, title, description, level")
    .eq("id", params.id)
    .single();
  if (!deck) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Check user_decks record
  const { data: userDeck } = await adminSupabase
    .from("user_decks")
    .select("expired_at")
    .eq("user_id", user.id)
    .eq("deck_id", params.id)
    .maybeSingle();  // maybeSingle không throw khi không có row

  // hasFullAccess: có record user_decks VÀ không hết hạn (null = không hết hạn)
  const fullAccess = userDeck !== null && userDeck !== undefined
    ? hasFullAccess(userDeck.expired_at)
    : false;

  // Lấy content từ DB
  const { data: rows } = await adminSupabase
    .from("flashcards")
    .select("id, deck_id, content, created_at")
    .eq("deck_id", params.id)
    .order("created_at", { ascending: true });

  // Normalize: gộp tất cả rows thành mảng Tab[]
  const allTabs: Tab[] = (rows ?? []).flatMap(r =>
    extractTabs((r as unknown as FlashcardRow).content)
  );

  let tabs = allTabs;

  // Demo: giới hạn DEMO_LIMIT từ đầu tiên
  if (!fullAccess) {
    let seen = 0;
    tabs = allTabs.map(tab => {
      const remaining = DEMO_LIMIT - seen;
      if (remaining <= 0) return null;
      const vocab = (tab.vocabulary ?? []).slice(0, remaining);
      seen += vocab.length;
      return { ...tab, vocabulary: vocab };
    }).filter((t): t is Tab => t !== null && t.vocabulary.length > 0);
  }

  const totalWords = tabs.reduce((s, t) => s + (t.vocabulary?.length ?? 0), 0);

  return NextResponse.json({
    deck,
    tabs,          // ← dạng Tab[] giống const tabs trong Embed Flashcard
    isDemo: !fullAccess,
    totalWords,
  });
}
