import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";
import { extractTabs, hasFullAccess } from "@/lib/utils";
import { DEMO_LIMIT } from "@/lib/constants";
import type { FlashcardRow, Tab } from "@/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const adminSupabase = createAdminClient();

  const { data: deck, error } = await adminSupabase
    .from("decks")
    .select("id, title, description, level, access_level")
    .eq("id", params.id)
    .single();

  if (error || !deck) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ deck });
}
