import { createClient } from "@/services/supabase/server";
import { AdminDecksClient } from "./AdminDecksClient";
import { normalizeUnits } from "@/types";

export default async function AdminDecksPage() {
  const supabase = await createClient();
  const { data: decks } = await supabase
    .from("decks")
    .select("*, flashcards(content)")
    .order("created_at", { ascending: false });

  const enriched = (decks ?? []).map((d) => ({
    id: d.id as string,
    title: d.title as string,
    description: d.description as string | null,
    level: d.level as string | null,
    created_at: d.created_at as string,
    unit_count: Array.isArray(d.flashcards) ? d.flashcards.length : 0,
    word_count: Array.isArray(d.flashcards)
      ? d.flashcards.reduce((acc: number, fc: { content: unknown }) => {
          const units = normalizeUnits(fc.content as Parameters<typeof normalizeUnits>[0]);
          return acc + units.reduce((a, u) => a + (u.vocabulary?.length ?? 0), 0);
        }, 0)
      : 0,
  }));

  return <AdminDecksClient initialDecks={enriched} />;
}
