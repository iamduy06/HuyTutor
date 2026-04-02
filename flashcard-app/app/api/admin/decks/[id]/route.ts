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

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createAdminClient();
  const { data: deck } = await supabase.from("decks").select("*").eq("id", params.id).single();
  const { data: rows } = await supabase
    .from("flashcards").select("*").eq("deck_id", params.id)
    .order("created_at", { ascending: true });

  // Build normalized tabs from ALL rows
  const tabs: Tab[] = (rows ?? []).flatMap(r =>
    extractTabs((r as unknown as FlashcardRow).content)
  );

  // Flat cards for display (with tabIndex tracking)
  const cards = tabs.flatMap((tab, tabIdx) =>
    (tab.vocabulary ?? []).map(v => ({
      _rowId:    rows?.[0]?.id ?? "",   // for now point to first row
      _tabIndex: tabIdx,
      _tabLabel: tab.label ?? `Unit ${tabIdx + 1}`,
      content:   v,
    }))
  );

  return NextResponse.json({ deck, tabs, cards });
}

function computeLevelStr(min: string | null, max: string | null): string | null {
  if (!min && !max) return null;
  if (min && max && min !== max) return `${min} - ${max}`;
  return min ?? max;
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const levelStr = computeLevelStr(body.level_min ?? null, body.level_max ?? null);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("decks")
    .update({
      title: body.title,
      description: body.description,
      level: levelStr,
      level_min: body.level_min ?? null,
      level_max: body.level_max ?? null,
    })
    .eq("id", params.id).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deck: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createAdminClient();
  const { error } = await supabase.from("decks").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
