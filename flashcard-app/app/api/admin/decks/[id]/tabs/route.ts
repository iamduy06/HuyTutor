/**
 * POST /api/admin/decks/[id]/tabs
 * Thêm 1 tab mới vào cuối mảng tabs của deck.
 *
 * Content được lưu dạng { tabs: [...] } trong 1 row flashcard duy nhất.
 * Nếu chưa có row nào → tạo mới.
 * Nếu đã có → update content.
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

async function getOrCreateRow(supabase: ReturnType<typeof createAdminClient>, deckId: string) {
  const { data: rows } = await supabase
    .from("flashcards")
    .select("id, content")
    .eq("deck_id", deckId)
    .order("created_at", { ascending: true });

  if (rows && rows.length > 0) {
    // Merge all rows into first row's tabs (migration helper)
    const allTabs: Tab[] = rows.flatMap(r =>
      extractTabs((r as unknown as FlashcardRow).content)
    );
    return { id: rows[0].id as string, tabs: allTabs };
  }
  return { id: null, tabs: [] };
}

async function saveTabs(
  supabase: ReturnType<typeof createAdminClient>,
  deckId: string,
  rowId: string | null,
  tabs: Tab[]
) {
  const content = { tabs };
  if (rowId) {
    await supabase.from("flashcards").update({ content }).eq("id", rowId);
  } else {
    await supabase.from("flashcards").insert({ deck_id: deckId, content });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  if (!body.label?.trim()) return NextResponse.json({ error: "label là bắt buộc" }, { status: 400 });

  const supabase = createAdminClient();
  const { id: rowId, tabs } = await getOrCreateRow(supabase, params.id);

  const newTab: Tab = {
    id:         body.id?.trim() || `tab-${Date.now()}`,
    label:      body.label.trim(),
    desc:       body.desc?.trim() || undefined,
    vocabulary: [],
  };
  tabs.push(newTab);

  await saveTabs(supabase, params.id, rowId, tabs);
  return NextResponse.json({ success: true, tabIndex: tabs.length - 1 });
}
