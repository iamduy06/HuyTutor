/**
 * DELETE /api/admin/decks/[id]/tabs/[tabIndex]
 * Xóa 1 tab (và tất cả vocabulary trong đó).
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";
import { extractTabs } from "@/lib/utils";
import type { FlashcardRow, Tab } from "@/types";

async function checkAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users").select("role").eq("id", user.id).single();
  return data?.role === "ADMIN" ? user : null;
}

interface Params { params: { id: string; tabIndex: string } }

export async function DELETE(_req: NextRequest, { params }: Params) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tabIdx = parseInt(params.tabIndex);
  if (isNaN(tabIdx)) return NextResponse.json({ error: "Invalid tabIndex" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: rows } = await supabase
    .from("flashcards").select("id, content").eq("deck_id", params.id)
    .order("created_at", { ascending: true });

  if (!rows?.length) return NextResponse.json({ error: "No flashcard row" }, { status: 404 });

  const allTabs: Tab[] = rows.flatMap(r =>
    extractTabs((r as unknown as FlashcardRow).content)
  );
  if (tabIdx < 0 || tabIdx >= allTabs.length)
    return NextResponse.json({ error: "Tab not found" }, { status: 404 });

  allTabs.splice(tabIdx, 1);

  await supabase.from("flashcards")
    .update({ content: { tabs: allTabs } }).eq("id", rows[0].id);

  // Delete extra rows if any (cleanup)
  if (rows.length > 1) {
    await supabase.from("flashcards").delete().in("id", rows.slice(1).map(r => r.id));
  }

  return NextResponse.json({ success: true });
}
