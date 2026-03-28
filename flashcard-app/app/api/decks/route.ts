import { NextResponse } from "next/server";
import { createAdminClient } from "@/services/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();

  const { data: decks, error } = await supabase
    .from("decks")
    .select(`
      id, title, description, level, created_at,
      flashcards(count)
    `)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch decks" }, { status: 500 });
  }

  const formatted = (decks ?? []).map((d: any) => ({
    ...d,
    flashcard_count: d.flashcards?.[0]?.count ?? 0,
    flashcards: undefined,
  }));

  return NextResponse.json({ decks: formatted });
}
