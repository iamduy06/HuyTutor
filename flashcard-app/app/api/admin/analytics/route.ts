import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();

  const [
    { count: totalUsers },
    { count: totalDecks },
    { data: deckStats },
    { data: progressStats },
  ] = await Promise.all([
    admin.from("users").select("*", { count: "exact", head: true }),
    admin.from("decks").select("*", { count: "exact", head: true }),
    admin.from("user_decks")
      .select("deck_id, deck:decks(title), progress_percent")
      .order("deck_id"),
    admin.from("user_decks").select("progress_percent"),
  ]);

  const avgProgress = progressStats?.length
    ? Math.round(progressStats.reduce((s: number, r: any) => s + (r.progress_percent || 0), 0) / progressStats.length)
    : 0;

  // Popular decks by user count
  const deckMap: Record<string, { title: string; count: number; avgProgress: number; totalProgress: number }> = {};
  (deckStats ?? []).forEach((r: any) => {
    const id = r.deck_id;
    if (!deckMap[id]) deckMap[id] = { title: r.deck?.title ?? id, count: 0, avgProgress: 0, totalProgress: 0 };
    deckMap[id].count++;
    deckMap[id].totalProgress += r.progress_percent || 0;
  });
  const popularDecks = Object.values(deckMap)
    .map((d) => ({ ...d, avgProgress: d.count ? Math.round(d.totalProgress / d.count) : 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return NextResponse.json({ totalUsers, totalDecks, avgProgress, popularDecks });
}
