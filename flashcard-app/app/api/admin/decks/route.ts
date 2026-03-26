import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/services/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";

async function checkAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users").select("role").eq("id", user.id).single();
  return data?.role === "ADMIN" ? user : null;
}

export async function GET() {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("decks")
    .select(`*, flashcards(count)`)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const decks = (data ?? []).map((d: any) => ({
    ...d,
    flashcard_count: d.flashcards?.[0]?.count ?? 0,
    flashcards: undefined,
  }));

  return NextResponse.json({ decks });
}

export async function POST(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { title, description, level } = body;
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("decks")
    .insert({ title, description, level })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deck: data });
}
