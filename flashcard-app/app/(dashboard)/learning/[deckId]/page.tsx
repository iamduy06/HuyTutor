import { redirect, notFound } from "next/navigation";
import { createClient } from "@/services/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";
import { FlashcardPlayer } from "@/components/flashcard/FlashcardPlayer";
import { isExpired } from "@/lib/utils";
import { DEMO_CARD_LIMIT } from "@/lib/constants";
import type { Flashcard } from "@/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FACEBOOK_URL } from "@/lib/constants";

interface Props { params: { deckId: string } }

export default async function LearningPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const { data: deck } = await admin
    .from("decks")
    .select("id, title, description, level")
    .eq("id", params.deckId)
    .single();

  if (!deck) notFound();

  // Check user access
  const { data: userDeck } = await admin
    .from("user_decks")
    .select("expired_at, progress_percent, learned_count, streak")
    .eq("user_id", user.id)
    .eq("deck_id", params.deckId)
    .single();

  const hasFullAccess = userDeck && !isExpired(userDeck.expired_at);

  let query = admin
    .from("flashcards")
    .select("id, deck_id, content, order_index")
    .eq("deck_id", params.deckId)
    .order("order_index", { ascending: true });

  if (!hasFullAccess) {
    query = query.limit(DEMO_CARD_LIMIT) as typeof query;
  }

  const { data: cards } = await query;
  const typedCards = (cards ?? []) as Flashcard[];

  return (
    <div className="flex flex-col flex-1 min-h-[calc(100vh-62px)]">
      {!hasFullAccess && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2.5 text-center text-sm text-yellow-800 flex items-center justify-center gap-3 flex-wrap">
          <span>⚠️ Bộ đề đã <strong>hết hạn</strong> hoặc chưa được cấp quyền. Bạn chỉ xem được tối đa {DEMO_CARD_LIMIT} từ.</span>
          <Button variant="brand" size="sm" asChild className="rounded-full">
            <Link href={FACEBOOK_URL} target="_blank">💬 Liên hệ gia hạn</Link>
          </Button>
        </div>
      )}
      <FlashcardPlayer
        cards={typedCards}
        deckTitle={deck.title}
        deckDesc={deck.description ?? undefined}
        isDemo={!hasFullAccess}
      />
    </div>
  );
}
