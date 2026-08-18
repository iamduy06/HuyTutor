/**
 * PUT    /api/admin/decks/[id]/tabs/[tabIndex]  — Sửa tab (label, id, desc)
 * DELETE /api/admin/decks/[id]/tabs/[tabIndex]  — Xóa tab
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

async function loadAndSave(
  supabase: ReturnType<typeof createAdminClient>,
  deckId: string,
  mutateFn: (tabs: Tab[]) => void
) {
  const { data: rows } = await supabase
    .from("flashcards").select("id, content").eq("deck_id", deckId)
    .order("created_at", { ascending: true });

  const allTabs: Tab[] = (rows ?? []).flatMap(r =>
    extractTabs((r as unknown as FlashcardRow).content)
  );
  mutateFn(allTabs);

  const rowId = rows?.[0]?.id as string ?? null;
  const extraIds = (rows ?? []).slice(1).map(r => r.id as string);

  if (rowId) await supabase.from("flashcards").update({ content: { tabs: allTabs } }).eq("id", rowId);
  else       await supabase.from("flashcards").insert({ deck_id: deckId, content: { tabs: allTabs } });

  if (extraIds.length) await supabase.from("flashcards").delete().in("id", extraIds);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tabIdx = parseInt(params.tabIndex);
  if (isNaN(tabIdx)) return NextResponse.json({ error: "Invalid tabIndex" }, { status: 400 });

  const body = await request.json();
  const supabase = createAdminClient();

  let notFound = false;
  await loadAndSave(supabase, params.id, (tabs) => {
    if (!tabs[tabIdx]) { notFound = true; return; }
    if (body.label !== undefined) tabs[tabIdx].label = body.label;
    if (body.id    !== undefined) tabs[tabIdx].id    = body.id;
    if (body.desc  !== undefined) tabs[tabIdx].desc  = body.desc;
  });

  if (notFound) return NextResponse.json({ error: "Tab not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tabIdx = parseInt(params.tabIndex);
  if (isNaN(tabIdx)) return NextResponse.json({ error: "Invalid tabIndex" }, { status: 400 });

  const supabase = createAdminClient();
  await loadAndSave(supabase, params.id, (tabs) => {
    tabs.splice(tabIdx, 1);
  });

  return NextResponse.json({ success: true });
}
