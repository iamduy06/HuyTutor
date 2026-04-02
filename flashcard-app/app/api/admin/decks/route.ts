import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";
import { extractTabs } from "@/lib/utils";
import type { FlashcardRow } from "@/types";

async function checkAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users").select("role").eq("id", user.id).single();
  return data?.role === "ADMIN" ? user : null;
}

function computeLevelStr(min: string | null, max: string | null): string | null {
  if (!min && !max) return null;
  if (min && max && min !== max) return `${min} - ${max}`;
  return min ?? max;
}

export async function GET() {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("decks")
    .select("id, title, description, level, level_min, level_max, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Word count
  const { data: cards } = await supabase
    .from("flashcards").select("deck_id, content");

  const wordCountMap: Record<string, number> = {};
  (cards ?? []).forEach((c: any) => {
    const tabs = extractTabs((c as unknown as FlashcardRow).content);
    const count = tabs.reduce((s, t) => s + (t.vocabulary?.length ?? 0), 0);
    wordCountMap[c.deck_id] = (wordCountMap[c.deck_id] ?? 0) + count;
  });

  const decks = (data ?? []).map((d: any) => ({
    ...d,
    word_count: wordCountMap[d.id] ?? 0,
    level: computeLevelStr(d.level_min, d.level_max) ?? d.level,
  }));

  return NextResponse.json({ decks });
}

export async function POST(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { title, description, level_min, level_max } = body;
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const supabase = createAdminClient();
  const levelStr = computeLevelStr(level_min ?? null, level_max ?? null);

  const { data, error } = await supabase
    .from("decks")
    .insert({ title, description, level: levelStr, level_min: level_min ?? null, level_max: level_max ?? null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deck: data });
}
