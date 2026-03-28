import { notFound } from "next/navigation";
import { createAdminClient } from "@/services/supabase/admin";
import { FlashcardPlayer } from "@/components/flashcard/FlashcardPlayer";
import { DEMO_CARD_LIMIT } from "@/lib/constants";
import type { Flashcard } from "@/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Props { params: { id: string } }

async function getDemoData(deckId: string) {
  const supabase = createAdminClient();

  const { data: deck } = await supabase
    .from("decks")
    .select("id, title, description, level")
    .eq("id", deckId)
    .single();

  if (!deck) return null;

  const { data: cards } = await supabase
    .from("flashcards")
    .select("id, deck_id, content, order_index")
    .eq("deck_id", deckId)
    .order("order_index", { ascending: true })
    .limit(DEMO_CARD_LIMIT);

  return { deck, cards: (cards ?? []) as Flashcard[] };
}

export default async function DeckDemoPage({ params }: Props) {
  const data = await getDemoData(params.id);
  if (!data) notFound();

  return (
    <div className="flex flex-col flex-1">
      <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-center text-sm text-yellow-800">
        🎯 Bạn đang xem <strong>bản demo</strong> (tối đa {DEMO_CARD_LIMIT} từ).{" "}
        <Button variant="link" asChild className="p-0 h-auto text-brand font-bold">
          <Link href="/login">Đăng nhập</Link>
        </Button>{" "}
        để truy cập đầy đủ.
      </div>
      <FlashcardPlayer
        cards={data.cards}
        deckTitle={data.deck.title}
        deckDesc={data.deck.description ?? undefined}
        isDemo
      />
    </div>
  );
}
