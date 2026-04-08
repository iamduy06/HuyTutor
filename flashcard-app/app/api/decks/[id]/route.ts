import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";
import { extractTabs, hasFullAccess } from "@/lib/utils";
import { DEMO_LIMIT } from "@/lib/constants";
import type { FlashcardRow, Tab } from "@/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase      = createClient();
  const adminSupabase = createAdminClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Deck info — bao gồm is_public
  const { data: deck } = await adminSupabase
    .from("decks")
    .select("id, title, description, level, is_public")
    .eq("id", params.id)
    .single();
  if (!deck) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Kiểm tra quyền truy cập:
  // 1. is_public = true → mọi user đã đăng nhập đều có full access
  // 2. is_public = false → kiểm tra user_decks
  let fullAccess = Boolean(deck.is_public);

  if (!fullAccess) {
    const { data: userDeck } = await adminSupabase
      .from("user_decks")
      .select("expired_at")
      .eq("user_id", user.id)
      .eq("deck_id", params.id)
      .maybeSingle();

    fullAccess = userDeck !== null && userDeck !== undefined
      ? hasFullAccess(userDeck.expired_at)
      : false;
  }

  // Lấy content
  const { data: rows } = await adminSupabase
    .from("flashcards")
    .select("id, deck_id, content, created_at")
    .eq("deck_id", params.id)
    .order("created_at", { ascending: true });

  const allTabs: Tab[] = (rows ?? []).flatMap(r =>
    extractTabs((r as unknown as FlashcardRow).content)
  );

  let tabs = allTabs;

  if (!fullAccess) {
    let seen = 0;
    tabs = allTabs.map(tab => {
      const remaining = DEMO_LIMIT - seen;
      if (remaining <= 0) return null;
      const vocab = (tab.vocabulary ?? []).slice(0, remaining);
      seen += vocab.length;
      return { ...tab, vocabulary: vocab };
    }).filter((t): t is Tab => t !== null && t.vocabulary.length > 0);
  }

  return NextResponse.json({
    deck,
    tabs,
    isDemo: !fullAccess,
    isPublic: Boolean(deck.is_public),
  });
}
