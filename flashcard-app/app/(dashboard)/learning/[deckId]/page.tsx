import { redirect, notFound } from "next/navigation";
import { createClient } from "@/services/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";
import { isExpired } from "@/lib/utils";
import { DEMO_CARD_LIMIT } from "@/lib/constants";
import type { Flashcard } from "@/types";
import { Workspace } from "@/components/flashcard/Workspace";

interface Props {
  params: { deckId: string };
}

export default async function LearningPage({ params }: Props) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  const { data: deck } = await admin
    .from("decks")
    .select("id, title, description, level")
    .eq("id", params.deckId)
    .single();

  if (!deck) notFound();

  const { data: userDeck } = await admin
    .from("user_decks")
    .select("expired_at")
    .eq("user_id", user.id)
    .eq("deck_id", params.deckId)
    .single();

  const hasFullAccess = userDeck !== null && !isExpired(userDeck.expired_at);

  let query = admin
    .from("flashcards")
    .select("id, deck_id, content, order_index")
    .eq("deck_id", params.deckId)
    .order("order_index", { ascending: true });

  if (!hasFullAccess) {
    query = query.limit(DEMO_CARD_LIMIT) as typeof query;
  }

  const { data: cards } = await query;

  return (
    <Workspace
      cards={(cards ?? []) as Flashcard[]}
      deckTitle={deck.title}
      deckDesc={deck.description ?? undefined}
      isDemo={!hasFullAccess}
    />
  );
}
