import { createClient } from "@/services/supabase/server";
import { SiteHeader } from "@/components/common/SiteHeader";
import { FlashcardPlayer } from "@/components/flashcard/FlashcardPlayer";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DEMO_CARD_LIMIT } from "@/lib/constants";
import { FlashcardContent } from "@/types";

async function getDemoData(deckId: string) {
  const supabase = await createClient();

  const { data: deck } = await supabase
    .from("decks")
    .select("id, title, description, level")
    .eq("id", deckId)
    .single();

  if (!deck) return null;

  // Use separate demo query — NOT the full deck API
  const { data: flashcards } = await supabase
    .from("flashcards")
    .select("id, content")
    .eq("deck_id", deckId)
    .limit(1); // get first unit for demo

  if (!flashcards || flashcards.length === 0) return { deck, units: [] };

  // Limit vocabulary to DEMO_CARD_LIMIT per unit
  const units: FlashcardContent[] = flashcards.map((fc) => {
    const content = fc.content as FlashcardContent;
    return {
      ...content,
      vocabulary: (content.vocabulary ?? []).slice(0, DEMO_CARD_LIMIT),
    };
  });

  return { deck, units };
}

export default async function DeckDemoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getDemoData(id);

  if (!data) notFound();

  const { deck, units } = data;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* Banner */}
      <div className="bg-brand-red-light border-b border-brand-red/20 px-5 py-3 flex items-center justify-between flex-wrap gap-2">
        <div>
          <span className="font-bold text-brand-red">{deck.title}</span>
          <span className="text-sm text-muted-foreground ml-2">— Chế độ xem thử (tối đa {DEMO_CARD_LIMIT} thẻ)</span>
        </div>
        <div className="flex gap-2">
          <Link href="/register">
            <Button size="sm">🔓 Mở khoá toàn bộ</Button>
          </Link>
          <a href="https://web.facebook.com/huytutor" target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline">💬 Liên hệ</Button>
          </a>
        </div>
      </div>

      {units.length === 0 ? (
        <div className="flex-1 flex items-center justify-center flex-col gap-4 py-20">
          <div className="text-6xl">📭</div>
          <p className="text-muted-foreground">Bộ đề này chưa có nội dung</p>
          <Link href="/decks"><Button variant="outline">← Quay lại</Button></Link>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 108px)" }}>
          <FlashcardPlayer units={units} isLimited />
        </div>
      )}
    </div>
  );
}
