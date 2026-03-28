import { createClient } from "@/services/supabase/server";
import { redirect, notFound } from "next/navigation";
import { SiteHeader } from "@/components/common/SiteHeader";
import { FlashcardPlayer } from "@/components/flashcard/FlashcardPlayer";
import { normalizeUnits } from "@/types";
import { isExpired } from "@/lib/utils";
import { DEMO_LIMIT } from "@/lib/constants";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default async function LearningPage({ params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify the user has access to this deck
  const { data: userDeck } = await supabase
    .from("user_decks")
    .select("*, deck:decks(id, title)")
    .eq("user_id", user.id)
    .eq("deck_id", deckId)
    .single();

  if (!userDeck) notFound();

  const expired = isExpired(userDeck.expired_at);

  // Fetch all flashcard rows for this deck
  const { data: flashcards } = await supabase
    .from("flashcards")
    .select("content")
    .eq("deck_id", deckId)
    .order("created_at", { ascending: true });

  // Normalize each row: content can be object OR array
  let units = (flashcards ?? []).flatMap((fc) => normalizeUnits(fc.content));

  // Expired → limit to first 10 words of first unit
  if (expired) {
    units = units.slice(0, 1).map((u) => ({
      ...u,
      vocabulary: (u.vocabulary ?? []).slice(0, DEMO_LIMIT),
    }));
  }

  const deck = userDeck.deck as { id: string; title: string } | null;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-gray-100 bg-white px-5 py-2.5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/dashboard"><Button variant="ghost" size="sm">← Dashboard</Button></Link>
          <span className="font-bold text-gray-900 truncate">{deck?.title}</span>
          {expired && (
            <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
              ⚠️ Hết hạn — xem 10 thẻ đầu
            </span>
          )}
        </div>
        {expired && (
          <a href="https://web.facebook.com/huytutor" target="_blank" rel="noopener noreferrer">
            <Button size="sm">🔓 Gia hạn ngay</Button>
          </a>
        )}
      </div>

      {units.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20">
          <div className="text-5xl">📭</div>
          <p className="text-gray-400">Bộ đề chưa có nội dung</p>
          <Link href="/dashboard"><Button variant="outline">← Quay lại</Button></Link>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 112px)" }}>
          <FlashcardPlayer units={units} isLimited={expired} />
        </div>
      )}
    </div>
  );
}
