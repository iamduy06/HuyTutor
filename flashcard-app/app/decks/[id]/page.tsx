import { createClient } from "@/services/supabase/server";
import { SiteHeader } from "@/components/common/SiteHeader";
import { FlashcardPlayer } from "@/components/flashcard/FlashcardPlayer";
import { normalizeUnits } from "@/types";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { DEMO_LIMIT } from "@/lib/constants";

export default async function DeckDemoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: deck } = await supabase
    .from("decks")
    .select("id, title, description, level")
    .eq("id", id)
    .single();

  if (!deck) notFound();

  // Fetch only the first flashcard row for demo (separate query from full deck)
  const { data: flashcards } = await supabase
    .from("flashcards")
    .select("content")
    .eq("deck_id", id)
    .limit(1);

  // Normalize: JSONB can be object or array
  const rawContent = flashcards?.[0]?.content;
  const units = rawContent
    ? normalizeUnits(rawContent).map((u) => ({
        ...u,
        vocabulary: (u.vocabulary ?? []).slice(0, DEMO_LIMIT),
      }))
    : [];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      {/* Demo banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-red/20 bg-brand-red-light px-5 py-3">
        <div>
          <span className="font-bold text-brand-red">{deck.title}</span>
          <span className="ml-2 text-sm text-gray-500">— Xem thử tối đa {DEMO_LIMIT} thẻ</span>
        </div>
        <div className="flex gap-2">
          <Link href="/register"><Button size="sm">🔓 Mở khoá toàn bộ</Button></Link>
          <a href="https://web.facebook.com/huytutor" target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline">💬 Liên hệ</Button>
          </a>
        </div>
      </div>

      {units.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20">
          <div className="text-6xl">📭</div>
          <p className="text-gray-400">Bộ đề này chưa có nội dung</p>
          <Link href="/decks"><Button variant="outline">← Quay lại</Button></Link>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 112px)" }}>
          <FlashcardPlayer units={units} isLimited />
        </div>
      )}
    </div>
  );
}
