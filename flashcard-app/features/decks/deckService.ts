import { createClient } from "@/services/supabase/client";
import { FlashcardContent } from "@/types";

export async function getFullDeck(deckId: string) {
  const res = await fetch(`/api/decks/${deckId}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Failed to load deck");
  }
  return res.json() as Promise<{
    deck: { id: string; title: string; description: string; level: string };
    units: FlashcardContent[];
    isLimited: boolean;
  }>;
}

export async function getDemoCards(deckId: string) {
  const res = await fetch(`/api/decks/demo?deckId=${deckId}`);
  if (!res.ok) throw new Error("Failed to load demo");
  return res.json();
}
