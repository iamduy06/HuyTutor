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

  if (!access.canLearnFull && !access.isPreview) {
    return NextResponse.json({ error: "Forbidden: Access required" }, { status: 403 });
  }

  // 3. Lấy data
  const { data: rows } = await adminSupabase
    .from("flashcards")
    .select("content, created_at")
    .eq("deck_id", params.id)
    .order("created_at", { ascending: true });

  const allTabs: Tab[] = (rows ?? []).flatMap(r =>
    extractTabs((r as unknown as FlashcardRow).content)
  );

  let finalTabs = allTabs;
  let isDemo = false;

  if (!access.canLearnFull && access.isPreview) {
    const limit = access.previewLimit || 10;
    let seen = 0;
    finalTabs = allTabs.map(tab => {
      const remaining = limit - seen;
      if (remaining <= 0) return null;
      const vocab = (tab.vocabulary ?? []).slice(0, remaining);
      seen += vocab.length;
      return { ...tab, vocabulary: vocab };
    }).filter((t): t is Tab => t !== null && t.vocabulary.length > 0);
    isDemo = true;
  }

  return NextResponse.json({ 
    deck: {
      id: deck.id,
      title: deck.title,
      description: deck.description
    },
    tabs: finalTabs, 
    isDemo: isDemo,
    previewLimit: access.previewLimit,
    totalWords: allTabs.reduce((s, t) => s + t.vocabulary.length, 0)
  });
}
