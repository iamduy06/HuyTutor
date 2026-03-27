import { createClient } from "@/services/supabase/server";
import { redirect, notFound } from "next/navigation";
import { SiteHeader } from "@/components/common/SiteHeader";
import { FlashcardPlayer } from "@/components/flashcard/FlashcardPlayer";
import { isExpired } from "@/lib/utils";
import { FlashcardContent } from "@/types";
import { DEMO_CARD_LIMIT } from "@/lib/constants";
import Link from "next/link";
import { Button } from "@/components/ui/button";

async function getLearningData(deckId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Check user has access to this deck
  const { data: userDeck } = await supabase
    .from("user_decks")
    .select("*, deck:decks(*)")
    .eq("user_id", user.id)
    .eq("deck_id", deckId)
    .single();

  if (!userDeck) return null;

  const expired = isExpired(userDeck.expired_at);

  // Fetch flashcards
  const { data: flashcards } = await supabase
    .from("flashcards")
    .select("id, content")
    .eq("deck_id", deckId)
    .order("created_at", { ascending: true });

  let units: FlashcardContent[] = (flashcards ?? []).map((fc) => fc.content as FlashcardContent);

  // If expired — limit to first 10 cards of first unit
  if (expired) {
    units = units.slice(0, 1).map((u) => ({
      ...u,
      vocabulary: u.vocabulary.slice(0, DEMO_CARD_LIMIT),
    }));
  }

  return { userDeck, units, expired, deck: userDeck.deck };
}

export default async function LearningPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = await params;
  const data = await getLearningData(deckId);

  if (!data) notFound();

  const { units, expired, deck } = data;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* Top bar */}
      <div className="bg-white border-b-2 border-border px-5 py-2.5 flex items-center justify-between flex-wrap gap-2 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">← Dashboard</Button>
          </Link>
          <span className="font-bold text-gray-900 truncate">{deck?.title}</span>
          {expired && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
              ⚠️ Hết hạn — xem thử 10 thẻ
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
        <div className="flex-1 flex items-center justify-center flex-col gap-3">
          <div className="text-5xl">📭</div>
          <p className="text-muted-foreground">Bộ đề chưa có nội dung</p>
          <Link href="/dashboard"><Button variant="outline">← Quay lại</Button></Link>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 110px)" }}>
          <FlashcardPlayer units={units} isLimited={expired} />
        </div>
      )}
    </div>
  );
}
