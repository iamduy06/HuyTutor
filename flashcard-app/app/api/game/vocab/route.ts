import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";
import { extractTabs } from "@/lib/utils";
import { shuffle, deduplicateVocab } from "@/features/game/gameUtils";
import type { FlashcardRow, VocabItem } from "@/types";

/**
 * GET /api/game/vocab?deckId=<id|all>&limit=<n>
 *
 * Trả về vocab từ deck(s) mà user có quyền truy cập.
 * - deckId=all  → gộp tất cả deck trong user_decks, deduplicate, random shuffle, cắt limit
 * - deckId=<id> → kiểm tra user có quyền → trả vocab của deck đó
 */
export async function GET(request: NextRequest) {
  // 1. Auth
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const searchParams = request.nextUrl.searchParams;
  const deckId = searchParams.get("deckId") ?? "all";
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : undefined;

  const admin = createAdminClient();

  // 2. Lấy user_decks (kèm deck info để check access)
  const { data: userDecks, error: udErr } = await admin
    .from("user_decks")
    .select("deck_id, expired_at, deck:decks(id, title, access_level)")
    .eq("user_id", user.id);

  if (udErr) return NextResponse.json({ error: udErr.message }, { status: 500 });

  // Lọc chỉ deck còn quyền truy cập
  const accessibleDecks = (userDecks ?? []).filter((ud: any) => {
    const levels = ud.deck?.access_level ?? {};
    if (levels.public || levels.auth) return true;         // free
    if (levels.paid) {
      if (!ud.expired_at) return true;                     // không giới hạn hạn
      return new Date(ud.expired_at) > new Date();         // còn hạn
    }
    return false;
  });

  if (accessibleDecks.length === 0) {
    return NextResponse.json({ vocab: [], deckTitle: "Tất cả", totalCount: 0 });
  }

  // 3. Xác định deck IDs cần lấy
  let targetDeckIds: string[];
  let deckTitle = "Tất cả deck";

  if (deckId === "all") {
    targetDeckIds = accessibleDecks.map((ud: any) => ud.deck_id as string);
  } else {
    // Kiểm tra deck có trong user_decks không
    const found = accessibleDecks.find((ud: any) => ud.deck_id === deckId);
    if (!found) {
      return NextResponse.json({ error: "Forbidden: deck not accessible" }, { status: 403 });
    }
    targetDeckIds = [deckId];
    deckTitle = (found as any).deck?.title ?? deckId;
  }

  // 4. Fetch flashcards
  const { data: flashcards, error: fcErr } = await admin
    .from("flashcards")
    .select("deck_id, content")
    .in("deck_id", targetDeckIds);

  if (fcErr) return NextResponse.json({ error: fcErr.message }, { status: 500 });

  // 5. Extract + flatten vocab
  const allVocab: VocabItem[] = (flashcards ?? []).flatMap((row: any) => {
    const tabs = extractTabs((row as unknown as FlashcardRow).content);
    return tabs.flatMap(t => t.vocabulary ?? []);
  });

  // 6. Deduplicate (quan trọng khi "all decks")
  const deduped = deduplicateVocab(allVocab);
  const totalCount = deduped.length;

  // 7. Shuffle + limit
  const shuffled = shuffle(deduped);
  const vocab = limit ? shuffled.slice(0, limit) : shuffled;

  return NextResponse.json({ vocab, deckTitle, totalCount });
}
