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
  const { title, description, level_min, level_max, access_level, preview_word_limit, group_id } = body;
  const levelStr = computeLevelStr(body.level_min ?? null, body.level_max ?? null);

  if (access_level && !["public", "authenticated", "authorized", "preview"].includes(access_level)) {
    return NextResponse.json({ error: "Invalid access_level" }, { status: 400 });
  }

  const limitNum = parseInt(preview_word_limit);
  if (access_level === 'preview' && (isNaN(limitNum) || limitNum <= 0)) {
    return NextResponse.json({ error: "preview_word_limit must be > 0 when access_level is preview" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("decks")
    .update({
      title: title,
      description: description,
      level: levelStr,
      level_min: level_min ?? null,
      level_max: level_max ?? null,
      group_id: group_id === undefined ? undefined : (group_id || null),
      ...(access_level ? { access_level } : {}),
      ...(access_level === 'preview' ? { preview_word_limit: limitNum } : {}),
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
