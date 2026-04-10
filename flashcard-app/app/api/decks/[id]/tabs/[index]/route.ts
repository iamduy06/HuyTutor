import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";
import { extractTabs, getDeckAccess } from "@/lib/utils";
import type { FlashcardRow } from "@/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string, index: string } }
) {
  const supabase = createClient();
  const adminSupabase = createAdminClient();
  const tabIndex = parseInt(params.index);

  // 1. Lấy thông tin deck để check access
  const { data: deck } = await adminSupabase
    .from("decks")
    .select("id, access_level")
    .eq("id", params.id)
    .single();

  if (!deck) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // 2. Kiểm tra quyền
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
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 3. Lấy dữ liệu tab cụ thể
  const { data: rows } = await adminSupabase
    .from("flashcards")
    .select("content, created_at")
    .eq("deck_id", params.id)
    .order("created_at", { ascending: true });

  const allTabs = (rows ?? []).flatMap(r => extractTabs((r as unknown as FlashcardRow).content));
  const targetTab = allTabs[tabIndex];

  if (!targetTab) return NextResponse.json({ error: "Tab not found" }, { status: 404 });

  return NextResponse.json({ 
    vocabulary: targetTab.vocabulary ?? [] 
  });
}
