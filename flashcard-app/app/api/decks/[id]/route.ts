import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/services/supabase/server";
import { isExpired } from "@/lib/utils";
import { DEMO_CARD_LIMIT } from "@/lib/constants";
import { FlashcardContent } from "@/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: deckId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check user-deck access
  const { data: userDeck } = await supabase
    .from("user_decks")
    .select("expired_at")
    .eq("user_id", user.id)
    .eq("deck_id", deckId)
    .single();

  if (!userDeck) return NextResponse.json({ error: "No access" }, { status: 403 });

  const expired = isExpired(userDeck.expired_at);

  const { data: deck } = await supabase.from("decks").select("*").eq("id", deckId).single();
  if (!deck) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: flashcards } = await supabase
    .from("flashcards")
    .select("id, content")
    .eq("deck_id", deckId)
    .order("created_at", { ascending: true });

  let units: FlashcardContent[] = (flashcards ?? []).map((fc) => fc.content as FlashcardContent);

  if (expired) {
    units = units.slice(0, 1).map((u) => ({
      ...u,
      vocabulary: u.vocabulary.slice(0, DEMO_CARD_LIMIT),
    }));
  }

  return NextResponse.json({ deck, units, isLimited: expired });
}
