import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";
import { extractTabs, hasFullAccess } from "@/lib/utils";
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
    .select("access_level")
    .eq("id", params.id)
    .single();

  if (!deck) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let fullAccess = deck.access_level === "public";

  // 2. Nếu không public, kiểm tra login và quyền user_decks
  if (!fullAccess) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: userDeck } = await adminSupabase
      .from("user_decks")
      .select("expired_at")
      .eq("user_id", user.id)
      .eq("deck_id", params.id)
      .maybeSingle();

    if (userDeck && hasFullAccess(userDeck.expired_at)) {
      fullAccess = true;
    }
  }

  if (!fullAccess) {
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

  return NextResponse.json({ tabs: allTabs, isFull: true });
}
