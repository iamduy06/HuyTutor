import { createAdminClient } from "@/services/supabase/admin";
import { countWords } from "@/lib/utils";
import { DeckCard } from "@/components/flashcard/DeckCard";
import type { FlashcardRow } from "@/types";

export const revalidate = 60;

export default async function DecksPage() {
  const supabase = createAdminClient();

  const { data: decks } = await supabase
    .from("decks")
    .select("id, title, description, level, access_level, created_at")
    .in("access_level", ["public", "preview"])
    .order("created_at", { ascending: true });

  const { data: cards } = await supabase
    .from("flashcards")
    .select("deck_id, content");

  const wordMap: Record<string, number> = {};
  (cards ?? []).forEach((r: any) => {
    wordMap[r.deck_id] = (wordMap[r.deck_id] ?? 0) + countWords(r as unknown as FlashcardRow);
  });

  const formatted = (decks ?? []).map(d => ({ ...d, word_count: wordMap[d.id] ?? 0 }));

  return (
    <div className="py-12 px-[5%] max-w-6xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-[#1a1a2e] mb-2">📚 Bộ đề từ vựng</h1>
        <p className="text-muted-foreground text-lg">Học thử miễn phí — không cần đăng nhập</p>
      </div>
      {formatted.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <div className="text-5xl mb-4">📭</div>
          <p>Chưa có bộ đề nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {formatted.map(d => (
            <DeckCard key={d.id} deck={d} href={`/decks/${d.id}`} ctaLabel="Học thử" />
          ))}
        </div>
      )}
    </div>
  );
}
