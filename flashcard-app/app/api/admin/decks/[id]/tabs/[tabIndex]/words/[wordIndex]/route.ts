/**
 * PUT    /api/admin/decks/[id]/tabs/[tabIndex]/words/[wordIndex]  — Sửa word
 * DELETE /api/admin/decks/[id]/tabs/[tabIndex]/words/[wordIndex]  — Xóa word
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";
import { extractTabs } from "@/lib/utils";
import type { FlashcardRow, Tab, VocabItem } from "@/types";

async function checkAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users").select("role").eq("id", user.id).single();
  return data?.role === "ADMIN" ? user : null;
}

async function getTabsAndRow(supabase: ReturnType<typeof createAdminClient>, deckId: string) {
  const { data: rows } = await supabase
    .from("flashcards").select("id, content").eq("deck_id", deckId)
    .order("created_at", { ascending: true });
  const allTabs: Tab[] = (rows ?? []).flatMap(r =>
    extractTabs((r as unknown as FlashcardRow).content)
  );
  return {
    rowId: rows?.[0]?.id as string ?? null,
    tabs: allTabs,
    extraRowIds: (rows ?? []).slice(1).map(r => r.id as string),
  };
}

async function saveTabs(supabase: ReturnType<typeof createAdminClient>, deckId: string, rowId: string | null, tabs: Tab[], extraIds: string[]) {
  const content = { tabs };
  if (rowId) await supabase.from("flashcards").update({ content }).eq("id", rowId);
  else       await supabase.from("flashcards").insert({ deck_id: deckId, content });
  if (extraIds.length) await supabase.from("flashcards").delete().in("id", extraIds);
}

interface Params { params: { id: string; tabIndex: string; wordIndex: string } }

export async function PUT(request: NextRequest, { params }: Params) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tabIdx  = parseInt(params.tabIndex);
  const wordIdx = parseInt(params.wordIndex);
  if (isNaN(tabIdx) || isNaN(wordIdx))
    return NextResponse.json({ error: "Invalid index" }, { status: 400 });

  const word = await request.json() as VocabItem;
  if (!word.word?.trim() || !word.meaning?.trim())
    return NextResponse.json({ error: "word và meaning là bắt buộc" }, { status: 400 });

  const supabase = createAdminClient();
  const { rowId, tabs, extraRowIds } = await getTabsAndRow(supabase, params.id);

  if (!tabs[tabIdx] || !tabs[tabIdx].vocabulary[wordIdx])
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  tabs[tabIdx].vocabulary[wordIdx] = word;
  await saveTabs(supabase, params.id, rowId, tabs, extraRowIds);
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tabIdx  = parseInt(params.tabIndex);
  const wordIdx = parseInt(params.wordIndex);
  if (isNaN(tabIdx) || isNaN(wordIdx))
    return NextResponse.json({ error: "Invalid index" }, { status: 400 });

  const supabase = createAdminClient();
  const { rowId, tabs, extraRowIds } = await getTabsAndRow(supabase, params.id);

  if (!tabs[tabIdx])
    return NextResponse.json({ error: "Tab not found" }, { status: 404 });

  tabs[tabIdx].vocabulary.splice(wordIdx, 1);
  await saveTabs(supabase, params.id, rowId, tabs, extraRowIds);
  return NextResponse.json({ success: true });
}
