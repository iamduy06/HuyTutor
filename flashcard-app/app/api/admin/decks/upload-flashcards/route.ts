import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { normalizeUnits, RawFlashcardContent } from "@/types";

export async function POST(request: NextRequest) {
  const { error, adminClient } = await requireAdmin();
  if (error) return error;

  const { deckId, units } = await request.json() as { deckId?: string; units?: unknown };
  if (!deckId) return NextResponse.json({ error: "deckId required" }, { status: 400 });
  if (!units) return NextResponse.json({ error: "units required" }, { status: 400 });

  // Accept both object (single unit) and array (multiple units)
  const normalized = normalizeUnits(units as RawFlashcardContent);
  if (normalized.length === 0) return NextResponse.json({ error: "No valid units found" }, { status: 400 });

  // Each unit becomes one flashcard row
  const rows = normalized.map((unit) => ({ deck_id: deckId, content: unit }));

  const { error: insertError } = await adminClient!.from("flashcards").insert(rows);
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 });

  return NextResponse.json({ success: true, count: rows.length });
}
