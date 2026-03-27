import { createClient } from "@/services/supabase/server";
import { Progress } from "@/components/ui/progress";

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const [
    { count: totalUsers },
    { count: totalDecks },
    { data: userDecks },
    { data: deckStats },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("decks").select("*", { count: "exact", head: true }),
    supabase.from("user_decks").select("progress_percent, learned_count, streak"),
    supabase
      .from("user_decks")
      .select("deck_id, deck:decks(title), progress_percent")
      .order("progress_percent", { ascending: false }),
  ]);

  const avgProgress = userDecks && userDecks.length > 0
    ? Math.round(userDecks.reduce((a, b) => a + (b.progress_percent ?? 0), 0) / userDecks.length)
    : 0;
  const totalLearned = userDecks?.reduce((a, b) => a + (b.learned_count ?? 0), 0) ?? 0;
  const maxStreak = Math.max(...(userDecks?.map((u) => u.streak ?? 0) ?? [0]));

  // Group deck popularity
  const deckMap = new Map<string, { title: string; count: number; avgProgress: number; totalProgress: number }>();
  for (const ud of deckStats ?? []) {
    const deckId = ud.deck_id;
    const title = (ud.deck as { title?: string })?.title ?? deckId;
    if (!deckMap.has(deckId)) {
      deckMap.set(deckId, { title, count: 0, avgProgress: 0, totalProgress: 0 });
    }
    const entry = deckMap.get(deckId)!;
    entry.count++;
    entry.totalProgress += ud.progress_percent ?? 0;
    entry.avgProgress = Math.round(entry.totalProgress / entry.count);
  }
  const popularDecks = [...deckMap.values()].sort((a, b) => b.count - a.count).slice(0, 10);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-6">📊 Thống kê</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Tổng users", value: totalUsers ?? 0 },
          { label: "Tổng decks", value: totalDecks ?? 0 },
          { label: "Tiến độ TB", value: `${avgProgress}%` },
          { label: "Từ đã học", value: totalLearned },
          { label: "Streak cao nhất", value: `${maxStreak} ngày` },
          { label: "Lượt học", value: userDecks?.length ?? 0 },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border-2 border-border p-4 text-center">
            <div className="text-2xl font-extrabold text-brand-red">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border-2 border-border p-5">
        <h2 className="font-bold text-lg mb-4">🔥 Bộ đề phổ biến nhất</h2>
        {popularDecks.length === 0 ? (
          <p className="text-muted-foreground text-sm">Chưa có dữ liệu</p>
        ) : (
          <div className="space-y-4">
            {popularDecks.map((d, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold">{d.title}</span>
                  <span className="text-muted-foreground">{d.count} người học · TB {d.avgProgress}%</span>
                </div>
                <Progress value={d.avgProgress} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
