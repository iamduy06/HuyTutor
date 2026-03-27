import { createClient } from "@/services/supabase/server";
import { DeckCard } from "@/components/common/DeckCard";
import { SiteHeader } from "@/components/common/SiteHeader";

async function getAllDecks() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("decks")
    .select(`*, flashcards(id, content)`)
    .order("created_at", { ascending: false });

  return (data ?? []).map((d) => ({
    ...d,
    word_count: Array.isArray(d.flashcards)
      ? d.flashcards.reduce((acc: number, fc: { content?: { vocabulary?: unknown[] } }) =>
          acc + (fc?.content?.vocabulary?.length ?? 0), 0)
      : 0,
  }));
}

export default async function DecksPage() {
  const decks = await getAllDecks();

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 max-w-5xl mx-auto w-full px-5 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-brand-red mb-1">📚 Tất cả bộ đề</h1>
          <p className="text-muted-foreground">Chọn bộ đề và học thử miễn phí ngay hôm nay</p>
        </div>

        {decks.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <div className="text-6xl mb-4">📭</div>
            <p>Chưa có bộ đề nào. Vui lòng quay lại sau!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {decks.map((deck) => (
              <DeckCard key={deck.id} deck={deck} href={`/decks/${deck.id}`} />
            ))}
          </div>
        )}
      </div>

      <footer className="text-center py-5 text-muted-foreground text-xs border-t bg-white">
        © Bản quyền thuộc về <strong>Huy Tutor</strong>
      </footer>
    </div>
  );
}
