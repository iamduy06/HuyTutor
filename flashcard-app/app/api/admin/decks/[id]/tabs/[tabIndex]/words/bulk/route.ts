/**
 * POST /api/admin/decks/[id]/tabs/[tabIndex]/words/bulk
 * Import nhiều từ cùng lúc vào 1 tab.
 * Body: { words: VocabItem[] }
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

interface Params { params: { id: string; tabIndex: string } }

export async function POST(request: NextRequest, { params }: Params) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tabIdx = parseInt(params.tabIndex);
  if (isNaN(tabIdx)) return NextResponse.json({ error: "Invalid tabIndex" }, { status: 400 });

  const body = await request.json();
  const words: VocabItem[] = Array.isArray(body.words) ? body.words : Array.isArray(body) ? body : [];
  if (!words.length) return NextResponse.json({ error: "Không có từ nào" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: rows } = await supabase
    .from("flashcards").select("id, content").eq("deck_id", params.id)
    .order("created_at", { ascending: true });

  const allTabs: Tab[] = (rows ?? []).flatMap(r =>
    extractTabs((r as unknown as FlashcardRow).content)
  );

  if (tabIdx < 0 || tabIdx >= allTabs.length)
    return NextResponse.json({ error: "Tab not found" }, { status: 404 });

  allTabs[tabIdx].vocabulary = [...(allTabs[tabIdx].vocabulary ?? []), ...words];

  const rowId = rows?.[0]?.id as string ?? null;
  const content = { tabs: allTabs };
  if (rowId) {
    await supabase.from("flashcards").update({ content }).eq("id", rowId);
  } else {
    await supabase.from("flashcards").insert({ deck_id: params.id, content });
  }
  // Cleanup extra rows
  const extraIds = (rows ?? []).slice(1).map(r => r.id as string);
  if (extraIds.length) await supabase.from("flashcards").delete().in("id", extraIds);

  return NextResponse.json({ success: true, added: words.length });
}
