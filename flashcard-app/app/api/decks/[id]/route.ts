import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";
import { extractTabs, hasFullAccess } from "@/lib/utils";
import { DEMO_LIMIT } from "@/lib/constants";
import type { FlashcardRow, Tab, AccessMode } from "@/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase      = createClient();
  const adminSupabase = createAdminClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();

  // Deck info — including access_mode and is_public
  const { data: deck } = await adminSupabase
    .from("decks")
    .select("id, title, description, level, is_public, access_mode")
    .eq("id", params.id)
    .single();
  if (!deck) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const accessMode: AccessMode = (deck.access_mode as AccessMode) ?? "assigned_only";

  // --- Access logic ---
  // public_demo: always demo for everyone
  if (accessMode === "public_demo") {
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: rows } = await adminSupabase
      .from("flashcards")
      .select("id, deck_id, content, created_at")
      .eq("deck_id", params.id)
      .order("created_at", { ascending: true });

    const demoTabs = buildDemoTabs(rows ?? []);
    return NextResponse.json({ deck, tabs: demoTabs, isDemo: true, isPublic: false });
  }

  // Require login for remaining modes
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let fullAccess = false;

  if (accessMode === "public_full") {
    // Everyone logged in gets full
    fullAccess = true;
  } else if (accessMode === "login_full" || Boolean(deck.is_public)) {
    // Any logged-in user gets full
    fullAccess = true;
  } else {
    // assigned_only — check user_decks
    const { data: userDeck } = await adminSupabase
      .from("user_decks")
      .select("expired_at")
      .eq("user_id", user.id)
      .eq("deck_id", params.id)
      .maybeSingle();

    fullAccess = userDeck !== null && userDeck !== undefined
      ? hasFullAccess(userDeck.expired_at)
      : false;
  }

  // Fetch flashcard rows
  const { data: rows } = await adminSupabase
    .from("flashcards")
    .select("id, deck_id, content, created_at")
    .eq("deck_id", params.id)
    .order("created_at", { ascending: true });

  const allTabs: Tab[] = (rows ?? []).flatMap(r =>
    extractTabs((r as unknown as FlashcardRow).content)
  );

  const tabs = fullAccess ? allTabs : buildDemoTabs(rows ?? []);

  return NextResponse.json({
    deck,
    tabs,
    isDemo: !fullAccess,
    isPublic: accessMode === "public_full" || accessMode === "login_full" || Boolean(deck.is_public),
  });
}

// Build demo tabs capped at DEMO_LIMIT words
function buildDemoTabs(rows: any[]): Tab[] {
  const allTabs: Tab[] = rows.flatMap((r: any) =>
    extractTabs((r as unknown as FlashcardRow).content)
  );
  let seen = 0;
  return allTabs.map(tab => {
    const remaining = DEMO_LIMIT - seen;
    if (remaining <= 0) return null;
    const vocab = (tab.vocabulary ?? []).slice(0, remaining);
    seen += vocab.length;
    return { ...tab, vocabulary: vocab };
  }).filter((t): t is Tab => t !== null && t.vocabulary.length > 0);
}
