import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: me } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!me || (me.role !== "SUBADMIN" && me.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();

  if (me.role === "ADMIN") {
    // Admin sees all decks
    const { data } = await admin
      .from("decks")
      .select("id, title, description, level, is_public, flashcards(count)")
      .order("created_at", { ascending: true });
    const formatted = (data ?? []).map((d: any) => ({
      ...d, word_count: d.flashcards?.[0]?.count ?? 0, flashcards: undefined,
    }));
    return NextResponse.json({ decks: formatted });
  }

  // SubAdmin only sees their assigned decks
  const { data: userDecks } = await admin
    .from("user_decks")
    .select("deck_id, expired_at, deck:decks(id, title, description, level, is_public)")
    .eq("user_id", user.id);

  const deckIds = (userDecks ?? []).map((ud: any) => ud.deck?.id).filter(Boolean);

  if (deckIds.length === 0) return NextResponse.json({ decks: [] });

  const { data: cards } = await admin
    .from("flashcards")
    .select("deck_id, content")
    .in("deck_id", deckIds);

  const wordMap: Record<string, number> = {};
  (cards ?? []).forEach((c: any) => {
    wordMap[c.deck_id] = (wordMap[c.deck_id] ?? 0) + 1;
  });

  const decks = (userDecks ?? []).map((ud: any) => ({
    ...(ud.deck ?? {}),
    word_count: wordMap[ud.deck?.id] ?? 0,
    my_expired_at: ud.expired_at,
  })).filter(d => d.id);

  return NextResponse.json({ decks });
}
