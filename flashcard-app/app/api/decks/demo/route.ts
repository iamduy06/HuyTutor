import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/services/supabase/admin";
import { normaliseUnits } from "@/lib/utils";
import { DEMO_LIMIT } from "@/lib/constants";
import type { FlashcardRow, FlashcardUnit } from "@/types";

export async function GET(req: NextRequest) {
  const deckId = req.nextUrl.searchParams.get("deckId");
  if (!deckId) return NextResponse.json({ error: "deckId required" }, { status: 400 });

  const supabase = createAdminClient();

  const { data: deck } = await supabase
    .from("decks")
    .select("id, title, description, level")
    .eq("id", deckId)
    .single();

  if (!deck) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: rows } = await supabase
    .from("flashcards")
    .select("id, deck_id, content, created_at")
    .eq("deck_id", deckId)
    .order("created_at", { ascending: true })
    .limit(1); // first row is enough for demo

  const allUnits: FlashcardUnit[] = (rows ?? []).flatMap((r) =>
    normaliseUnits((r as unknown as FlashcardRow).content)
  );

  // Limit total vocab to DEMO_LIMIT across all units
  let seen = 0;
  const demoUnits = allUnits.map((unit) => {
    const remaining = DEMO_LIMIT - seen;
    if (remaining <= 0) return null;
    const vocab = (unit.vocabulary ?? []).slice(0, remaining);
    seen += vocab.length;
    return { ...unit, vocabulary: vocab };
  }).filter(Boolean) as FlashcardUnit[];

  return NextResponse.json({ deck, units: demoUnits, isDemo: true });
}
