import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/services/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";
import { FlashcardContent } from "@/types";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: appUser } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (appUser?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { deckId, units } = await request.json() as { deckId: string; units: FlashcardContent[] };
  if (!deckId || !Array.isArray(units)) {
    return NextResponse.json({ error: "deckId and units array required" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  // Insert each unit as a flashcard row
  const rows = units.map((unit) => ({
    deck_id: deckId,
    content: unit,
  }));

  const { error } = await adminClient.from("flashcards").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true, count: rows.length });
}
