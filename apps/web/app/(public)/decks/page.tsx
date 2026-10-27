import type { Deck, DeckGroup } from "@/types";
import { PublicGroupedDecks } from "@/components/flashcard/PublicGroupedDecks";

export const revalidate = 60;

interface GroupData {
  group: DeckGroup | null;
  decks: Deck[];
}

export default async function DecksPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://flashcard-api.huytutor.edu.vn/api/v1";

  let finalGroups: GroupData[] = [];
  try {
    const res = await fetch(`${apiUrl}/decks/public-grouped`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      finalGroups = data.groups ?? [];
    }
  } catch (err) {
    console.error("Failed to fetch public grouped decks from backend:", err);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-[#1a1a2e] mb-2">
          Thư viện Flashcard
        </h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Chọn bộ Flashcard để bắt đầu học. Các bộ Flashcard đánh dấu "Học thử" cho phép bạn trải nghiệm trước 10 từ.
        </p>
      </div>

      <PublicGroupedDecks groups={finalGroups} />
    </div>
  );
}
