import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";

// GET: List decks assigned to the groups managed by this subadmin
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
      .select("id, title, description, level, access_level, flashcards(count)")
      .order("created_at", { ascending: true });
    const formatted = (data ?? []).map((d: any) => ({
      ...d, word_count: d.flashcards?.[0]?.count ?? 0, flashcards: undefined,
    }));
    return NextResponse.json({ decks: formatted });
  }

  // SubAdmin: 1. Tìm nhóm quản lý -> 2. Tìm group_decks -> 3. Lấy info decks
  const { data: managedGroups } = await admin
    .from("group_users")
    .select("group_id")
    .eq("user_id", user.id)
    .eq("is_subadmin", true);
  
  const groupIds = (managedGroups ?? []).map(g => g.group_id);
  if (groupIds.length === 0) return NextResponse.json({ decks: [] });

  const { data: groupDecks } = await admin
    .from("group_decks")
    .select("deck_id, expired_at, deck:decks(id, title, description, level, access_level)")
    .in("group_id", groupIds);

  const deckIds = Array.from(new Set((groupDecks ?? []).map((gd: any) => gd.deck?.id).filter(Boolean)));

  if (deckIds.length === 0) return NextResponse.json({ decks: [] });

  const { data: cards } = await admin
    .from("flashcards")
    .select("deck_id, content")
    .in("deck_id", deckIds);

  const wordMap: Record<string, number> = {};
  (cards ?? []).forEach((c: any) => {
    wordMap[c.deck_id] = (wordMap[c.deck_id] ?? 0) + 1;
  });

  const decks = (groupDecks ?? []).map((gd: any) => ({
    ...(gd.deck ?? {}),
    word_count: wordMap[gd.deck?.id] ?? 0,
    group_expired_at: gd.expired_at,
  })).filter(d => d.id);

  return NextResponse.json({ decks });
}
