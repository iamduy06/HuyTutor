import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";
import { extractTabs } from "@/lib/utils";
import type { FlashcardRow } from "@/types";

/**
 * Lấy danh sách deck mà user có quyền truy cập (từ user_decks).
 * Dùng chung cho tất cả game pages.
 * Redirect về /login nếu chưa đăng nhập.
 */
export async function getUserGameDecks() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Lấy user_decks kèm deck title
  const { data: userDecks } = await admin
    .from("user_decks")
    .select("deck_id, expired_at, deck:decks(id, title, access_level)")
    .eq("user_id", user.id);

  // Lọc deck còn quyền
  const accessible = (userDecks ?? []).filter((ud: any) => {
    const levels = ud.deck?.access_level ?? {};
    if (levels.public || levels.auth) return true;
    if (levels.paid) {
      if (!ud.expired_at) return true;
      return new Date(ud.expired_at) > new Date();
    }
    return false;
  });

  if (accessible.length === 0) redirect("/dashboard");

  const deckIds = accessible.map((ud: any) => ud.deck_id as string);

  // Đếm số từ mỗi deck
  const { data: flashcards } = await admin
    .from("flashcards")
    .select("deck_id, content")
    .in("deck_id", deckIds);

  const wordCountMap: Record<string, number> = {};
  (flashcards ?? []).forEach((r: any) => {
    const tabs = extractTabs((r as unknown as FlashcardRow).content);
    const count = tabs.reduce((s, t) => s + (t.vocabulary?.length ?? 0), 0);
    wordCountMap[r.deck_id] = (wordCountMap[r.deck_id] ?? 0) + count;
  });

  const deckOptions = accessible.map((ud: any) => ({
    deck_id: ud.deck_id as string,
    title: (ud.deck as any)?.title ?? ud.deck_id,
    wordCount: wordCountMap[ud.deck_id as string] ?? 0,
  }));

  return deckOptions;
}
