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
    .select("id, title, description, access_level, preview_word_limit")
    .eq("id", params.id)
    .single();

  if (!deck) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let fullAccess = deck.access_level === "public";

  // 2. Kiểm tra quyền dùng getDeckAccess
  const { data: { user } } = await supabase.auth.getUser();
  const { data: userProfile } = user 
    ? await adminSupabase.from("users").select("role").eq("id", user.id).single()
    : { data: null };

  const { data: userDeck } = user
    ? await adminSupabase
        .from("user_decks")
        .select("expired_at")
        .eq("user_id", user.id)
        .eq("deck_id", params.id)
        .maybeSingle()
    : { data: null };

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

  const allTabs: Tab[] = (rows ?? []).flatMap(r =>
    extractTabs((r as unknown as FlashcardRow).content)
  );

  return NextResponse.json({ 
    deck: {
      id: deck.id,
      title: deck.title,
      description: deck.description
    },
    tabs: allTabs, 
    isDemo: false,
    totalWords: allTabs.reduce((s, t) => s + (t.vocabulary?.length ?? 0), 0)
  });
}
