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

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createAdminClient();
  const { data: deck } = await supabase.from("decks").select("*").eq("id", params.id).single();
  const { data: rows } = await supabase
    .from("flashcards").select("*").eq("deck_id", params.id)
    .order("created_at", { ascending: true });

  // Flatten mọi format thành mảng flat words để hiển thị trong admin
  const cards = (rows ?? []).flatMap(r => {
    const tabs = extractTabs((r as unknown as FlashcardRow).content);
    return tabs.flatMap(tab =>
      (tab.vocabulary ?? []).map(v => ({
        id: r.id,                 // row id (dùng để edit/delete)
        deck_id: r.deck_id,
        _tabLabel: tab.label,
        content: v,               // flat VocabItem
      }))
    );
  });

  return NextResponse.json({ deck, cards });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("decks")
    .update({ title: body.title, description: body.description, level: body.level })
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
