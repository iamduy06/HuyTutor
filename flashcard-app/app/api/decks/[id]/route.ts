import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/services/supabase/server";
import { normalizeUnits, RawFlashcardContent } from "@/types";
import { isExpired } from "@/lib/utils";
import { DEMO_LIMIT } from "@/lib/constants";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: userDeck } = await supabase
    .from("user_decks")
    .select("expired_at")
    .eq("user_id", user.id)
    .eq("deck_id", id)
    .single();

  if (!userDeck) return NextResponse.json({ error: "No access" }, { status: 403 });

  const expired = isExpired(userDeck.expired_at);

  const { data: deck } = await supabase.from("decks").select("*").eq("id", id).single();
  if (!deck) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: flashcards } = await supabase
    .from("flashcards")
    .select("content")
    .eq("deck_id", id)
    .order("created_at", { ascending: true });

  // Normalize: each row content can be object or array
  let units = (flashcards ?? []).flatMap((fc) =>
    normalizeUnits(fc.content as RawFlashcardContent)
  );

  if (expired) {
    units = units.slice(0, 1).map((u) => ({
      ...u,
      vocabulary: (u.vocabulary ?? []).slice(0, DEMO_LIMIT),
    }));
  }

  return NextResponse.json({ deck, units, isLimited: expired });
}
