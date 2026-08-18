import { createAdminClient } from "@/services/supabase/admin";
import { countWords } from "@/lib/utils";
import type { Deck, DeckGroup, FlashcardRow } from "@/types";
import { PublicGroupedDecks } from "@/components/flashcard/PublicGroupedDecks";

export const revalidate = 60;

export default async function DecksPage() {
  const supabase = createAdminClient();

  // 1. Fetch groups and preview decks
  const [groupsRes, decksRes] = await Promise.all([
    supabase.from("deck_groups").select("*").order("order_index", { ascending: true }),
    supabase.from("decks")
      .select("id, title, description, level, level_min, level_max, access_level, created_at, group_id")
      .eq("access_level->preview", true)
      .order("created_at", { ascending: true })
  ]);

  const groups: DeckGroup[] = groupsRes.data ?? [];
  const decks: Deck[] = decksRes.data ?? [];

  // 2. Fetch word counts
  const deckIds = decks.map(d => d.id);
  const { data: cards } = deckIds.length > 0
    ? await supabase.from("flashcards").select("deck_id, content").in("deck_id", deckIds)
    : { data: [] };

  const wordMap: Record<string, number> = {};
  (cards ?? []).forEach((r: any) => {
    wordMap[r.deck_id] = (wordMap[r.deck_id] ?? 0) + countWords(r as unknown as FlashcardRow);
  });

  const formattedDecks = decks.map(d => ({ ...d, word_count: wordMap[d.id] ?? 0 }));

  // 3. Grouping logic
  const groupMap: Record<string, Deck[]> = {};
  const ungroupedDecks: Deck[] = [];

  formattedDecks.forEach(deck => {
    if (deck.group_id) {
      if (!groupMap[deck.group_id]) groupMap[deck.group_id] = [];
      groupMap[deck.group_id].push(deck);
    } else {
      ungroupedDecks.push(deck);
    }
  });

  interface GroupData {
    group: DeckGroup | null;
    decks: Deck[];
  }

  const finalGroups: GroupData[] = groups
    .map(g => ({ group: g, decks: groupMap[g.id] || [] }))
    .filter(g => g.decks.length > 0);

  // Thêm nhóm "Chưa phân loại" nếu có deck ungrouped
  if (ungroupedDecks.length > 0) {
    finalGroups.push({ group: null, decks: ungroupedDecks });
  }

  return (
    <div className="py-16 px-[5%] max-w-6xl mx-auto min-h-screen">
      <div className="mb-12 text-center sm:text-left">
        <h1 className="text-4xl sm:text-5xl font-black text-[#1a1a2e] mb-4 tracking-tight">
          📚 Khám phá bộ Flashcard
        </h1>
        <div className="flex flex-col gap-2 text-muted-foreground">
          <p className="text-lg sm:text-xl font-medium mb-1">Học thử miễn phí — không cần đăng nhập</p>
          <p className="text-base sm:text-lg text-brand font-semibold italic">
            Luyện thi THPT - Học tiếng Anh chuyên ngành kinh tế
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
            <p className="text-sm font-bold bg-brand-light text-brand px-3 py-1 rounded-full w-fit">
              {decks.length} bộ đề sẵn sàng
            </p>
          </div>
        </div>
      </div>

      <PublicGroupedDecks groups={finalGroups} />
    </div>
  );
}

