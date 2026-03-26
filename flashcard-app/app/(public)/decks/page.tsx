import { createAdminClient } from "@/services/supabase/admin";
import { DeckCard } from "@/components/flashcard/DeckCard";
import type { Deck } from "@/types";

export const revalidate = 60;

async function getDecks(): Promise<Deck[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("decks")
    .select("*, flashcards(count)")
    .order("created_at", { ascending: true });

  return (data ?? []).map((d: any) => ({
    ...d,
    flashcard_count: d.flashcards?.[0]?.count ?? 0,
    flashcards: undefined,
  }));
}

export default async function DecksPage() {
  const decks = await getDecks();

  return (
    <div className="py-12 px-[5%] max-w-6xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-[#1a1a2e] mb-2">
          📚 Bộ đề từ vựng
        </h1>
        <p className="text-muted-foreground text-lg">
          Khám phá các bộ đề được biên soạn chuyên nghiệp. Học thử miễn phí, mua để học đầy đủ.
        </p>
      </div>

      {decks.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-lg">Chưa có bộ đề nào. Hãy quay lại sau!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              href={`/decks/${deck.id}`}
              ctaLabel="Học thử"
            />
          ))}
        </div>
      )}
    </div>
  );
}
