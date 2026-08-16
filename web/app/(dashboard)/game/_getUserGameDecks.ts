import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { serverApiClient } from "@/lib/server-api-client";

interface GameDeck {
  deck_id: string;
  title: string;
  wordCount: number;
  tabs: { id: string; label: string; wordCount: number }[];
}

interface GameDecksResponse {
  decks: GameDeck[];
}

/**
 * Lấy danh sách deck mà user có quyền truy cập (từ user_decks).
 * Dùng chung cho tất cả game pages.
 * Redirect về /login nếu chưa đăng nhập.
 *
 * All DB queries go through the Express API server (GET /api/me/game-decks).
 */
export async function getUserGameDecks(): Promise<GameDeck[]> {
  // Auth check only — no DB query
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // All DB access goes through the Express API server
  let decks: GameDeck[] = [];
  try {
    const res = await serverApiClient.get<GameDecksResponse>("/me/game-decks");
    decks = res.decks ?? [];
  } catch (err: any) {
    console.error("[getUserGameDecks] API error:", err);
    if (err?.message?.includes("401")) redirect("/login");
  }

  if (decks.length === 0) redirect("/dashboard");

  return decks;
}
