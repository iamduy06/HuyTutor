import { createClient } from "@/services/supabase/server";
import { AdminDecksClient } from "./AdminDecksClient";

export default async function AdminDecksPage() {
  const supabase = await createClient();
  const { data: decks } = await supabase
    .from("decks")
    .select(`*, flashcards(id)`)
    .order("created_at", { ascending: false });

  const decksWithCount = (decks ?? []).map((d) => ({
    ...d,
    flashcard_count: Array.isArray(d.flashcards) ? d.flashcards.length : 0,
  }));

  return <AdminDecksClient initialDecks={decksWithCount} />;
}
