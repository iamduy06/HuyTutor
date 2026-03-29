import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";
import { normaliseUnits, isExpired } from "@/lib/utils";
import { DEMO_LIMIT } from "@/lib/constants";
import type { FlashcardRow, FlashcardUnit, VocabItem } from "@/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase      = createClient();
  const adminSupabase = createAdminClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: deck } = await adminSupabase
    .from("decks")
    .select("id, title, description, level")
    .eq("id", params.id)
    .single();

  if (!deck) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Check user access
  const { data: userDeck } = await adminSupabase
    .from("user_decks")
    .select("expired_at")
    .eq("user_id", user.id)
    .eq("deck_id", params.id)
    .single();

  const hasFullAccess = userDeck !== null && !isExpired(userDeck.expired_at);

  const { data: rows } = await adminSupabase
    .from("flashcards")
    .select("id, deck_id, content, created_at")
    .eq("deck_id", params.id)
    .order("created_at", { ascending: true });

  // Normalise JSONB → always array of units
  let units: FlashcardUnit[] = (rows ?? []).flatMap((r) =>
    normaliseUnits((r as unknown as FlashcardRow).content)
  );

  // Enforce demo limit
  if (!hasFullAccess) {
    let seen = 0;
    units = units.map((unit) => {
      const remaining = DEMO_LIMIT - seen;
      if (remaining <= 0) return { ...unit, vocabulary: [] };
      const vocab = (unit.vocabulary ?? []).slice(0, remaining);
      seen += vocab.length;
      return { ...unit, vocabulary: vocab };
    }).filter((u) => u.vocabulary.length > 0);
  }

  return NextResponse.json({
    deck,
    units,
    isDemo: !hasFullAccess,
    totalWords: units.reduce((s, u) => s + u.vocabulary.length, 0),
  });
}
