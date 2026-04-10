import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";
import { extractTabs, getDeckAccess } from "@/lib/utils";
import type { FlashcardRow, Tab } from "@/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase      = createClient();
  const adminSupabase = createAdminClient();

  // 1. Lấy thông tin deck
  const { data: deck } = await adminSupabase
    .from("decks")
    .select("id, title, description, access_level")
    .eq("id", params.id)
    .single();

  if (!deck) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // 2. Kiểm tra quyền dùng getDeckAccess
  const { data: { user } } = await supabase.auth.getUser();
  const [
    { data: userProfile },
    { data: userDeck }
  ] = await Promise.all([
    user ? adminSupabase.from("users").select("role").eq("id", user.id).single() : Promise.resolve({ data: null }),
    user ? adminSupabase.from("user_decks").select("expired_at").eq("user_id", user.id).eq("deck_id", params.id).maybeSingle() : Promise.resolve({ data: null })
  ]);

  const access = getDeckAccess(userProfile as any, deck as any, userDeck);

  if (!access.canLearnFull) {
    return NextResponse.json({ error: "Forbidden: Full access required" }, { status: 403 });
  }

  // 3. Trả về full content
  const { data: rows } = await adminSupabase
    .from("flashcards")
    .select("content, created_at")
    .eq("deck_id", params.id)
    .order("created_at", { ascending: true });

  const allTabs = (rows ?? []).flatMap(r =>
    extractTabs((r as unknown as FlashcardRow).content)
  );

  // Optimize: Remove vocabulary from metadata response to save bandwidth
  const metaTabs = allTabs.map(t => ({
    id: t.id,
    label: t.label,
    desc: t.desc,
    word_count: t.vocabulary?.length ?? 0
  }));

  return NextResponse.json({ 
    deck: {
      id: deck.id,
      title: deck.title,
      description: deck.description
    },
    tabs: metaTabs, 
    isDemo: false,
    totalWords: metaTabs.reduce((s, t) => s + t.word_count, 0)
  });
}
