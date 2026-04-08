/**
 * POST /api/admin/decks/[id]/tabs
 *
 * Case 1: Thêm 1 tab mới
 *   Body: { id, label, desc }
 *
 * Case 2: Import nhiều tabs cùng lúc (BULK)
 *   Body dạng array:  [{ id, label, desc, vocabulary: [...] }, ...]
 *   Body dạng object: { tabs: [{ id, label, desc, vocabulary: [...] }, ...] }
 *   → Append tất cả vào cuối danh sách tabs hiện tại
 *
 * Tất cả đều ghi vào 1 flashcard row duy nhất: { tabs: [...] }
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

async function loadCurrentTabs(supabase: ReturnType<typeof createAdminClient>, deckId: string) {
  const { data: rows } = await supabase
    .from("flashcards").select("id, content").eq("deck_id", deckId)
    .order("created_at", { ascending: true });

  const tabs: Tab[] = (rows ?? []).flatMap(r =>
    extractTabs((r as unknown as FlashcardRow).content)
  );
  const rowId      = (rows?.[0]?.id as string) ?? null;
  const extraIds   = (rows ?? []).slice(1).map(r => r.id as string);
  return { rowId, tabs, extraIds };
}

async function persistTabs(
  supabase: ReturnType<typeof createAdminClient>,
  deckId: string, rowId: string | null,
  tabs: Tab[], extraIds: string[]
) {
  const content = { tabs };
  if (rowId) await supabase.from("flashcards").update({ content }).eq("id", rowId);
  else       await supabase.from("flashcards").insert({ deck_id: deckId, content });
  if (extraIds.length) await supabase.from("flashcards").delete().in("id", extraIds);
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const supabase = createAdminClient();
  const { rowId, tabs: current, extraIds } = await loadCurrentTabs(supabase, params.id);

  // ── BULK import: array hoặc { tabs: [...] } ──────────────────────────────
  const incomingTabs: Tab[] | null = Array.isArray(body)
    ? body as Tab[]
    : (body?.tabs && Array.isArray(body.tabs))
      ? body.tabs as Tab[]
      : null;

  if (incomingTabs !== null) {
    if (!incomingTabs.length)
      return NextResponse.json({ error: "Không có tab nào trong JSON" }, { status: 400 });

    // Validate: mỗi tab phải có label hoặc id
    for (const tab of incomingTabs) {
      if (!tab.label && !tab.id)
        return NextResponse.json({ error: "Mỗi tab cần có label hoặc id" }, { status: 400 });
      if (!Array.isArray(tab.vocabulary))
        tab.vocabulary = [];
    }

    const merged = [...current, ...incomingTabs];
    await persistTabs(supabase, params.id, rowId, merged, extraIds);
    return NextResponse.json({
      success: true,
      tabsAdded: incomingTabs.length,
      totalTabs: merged.length,
      totalWords: merged.reduce((s, t) => s + (t.vocabulary?.length ?? 0), 0),
    });
  }

  // ── Single tab add ────────────────────────────────────────────────────────
  if (!body.label?.trim())
    return NextResponse.json({ error: "label là bắt buộc" }, { status: 400 });

  const newTab: Tab = {
    id:         body.id?.trim() || `tab-${Date.now()}`,
    label:      body.label.trim(),
    desc:       body.desc?.trim() || undefined,
    vocabulary: [],
  };
  current.push(newTab);
  await persistTabs(supabase, params.id, rowId, current, extraIds);
  return NextResponse.json({ success: true, tabIndex: current.length - 1 });
}
