import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/services/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";
import { normalizeUnits, type RawFlashcardContent } from "@/types";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: me } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { deckId, units } = await request.json() as { deckId: string; units: unknown };
  if (!deckId) return NextResponse.json({ error: "deckId required" }, { status: 400 });
  if (!units) return NextResponse.json({ error: "units required" }, { status: 400 });

  // Normalize: accept object (1 unit) or array (many units)
  const normalized = normalizeUnits(units as RawFlashcardContent);

  const admin = createAdminClient();
  // Insert each unit as one flashcard row
  const rows = normalized.map((unit) => ({ deck_id: deckId, content: unit }));
  const { error } = await admin.from("flashcards").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true, count: rows.length });
}
