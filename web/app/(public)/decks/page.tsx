import { serverApiClient } from "@/lib/server-api-client";
import type { Deck, DeckGroup } from "@/types";
import { PublicGroupedDecks } from "@/components/flashcard/PublicGroupedDecks";

export const dynamic = "force-dynamic";

interface PublicDecksResponse {
  decks: (Deck & { word_count: number; group_id: string | null })[];
  groups: DeckGroup[];
}

export default async function DecksPage() {
  // All DB queries go through the Express API server (no auth needed for this endpoint)
  const { decks, groups } = await serverApiClient.get<PublicDecksResponse>("/decks");

  // Group logic (moved from Supabase SSR to client-side grouping after API call)
  const groupMap: Record<string, Deck[]> = {};
  const ungroupedDecks: Deck[] = [];

  decks.forEach(deck => {
    if ((deck as any).group_id) {
      if (!groupMap[(deck as any).group_id]) groupMap[(deck as any).group_id] = [];
      groupMap[(deck as any).group_id].push(deck);
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
