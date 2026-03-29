import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";

async function checkAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users").select("role").eq("id", user.id).single();
  return data?.role === "ADMIN" ? user : null;
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const supabase = createAdminClient();

  // Bulk insert
  if (Array.isArray(body.cards)) {
    const cards = body.cards.map((c: any, i: number) => ({
      deck_id: params.id,
      content: c,
      order_index: i,
    }));
    const { data, error } = await supabase.from("flashcards").insert(cards).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ cards: data });
  }

  // Single insert
  const { data: existing } = await supabase
    .from("flashcards")
    .select("order_index")
    .eq("deck_id", params.id)
    .order("order_index", { ascending: false })
    .limit(1);
  const nextIndex = (existing?.[0]?.order_index ?? -1) + 1;

  const { data, error } = await supabase
    .from("flashcards")
    .insert({ deck_id: params.id, content: body, order_index: nextIndex })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ card: data });
}
