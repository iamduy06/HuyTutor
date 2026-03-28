import { createClient } from "@/services/supabase/server";
import { Progress } from "@/components/ui/Progress";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const [
    { count: totalUsers },
    { count: totalDecks },
    { data: userDecks },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("decks").select("*", { count: "exact", head: true }),
    supabase.from("user_decks").select("deck_id, progress_percent, learned_count, streak, deck:decks(title)"),
  ]);

  const avgProgress = userDecks?.length
    ? Math.round(userDecks.reduce((a, b) => a + (b.progress_percent ?? 0), 0) / userDecks.length)
    : 0;
  const totalLearned = userDecks?.reduce((a, b) => a + (b.learned_count ?? 0), 0) ?? 0;
  const maxStreak = Math.max(0, ...(userDecks?.map((u) => u.streak ?? 0) ?? []));

  // Group by deck
  const deckMap = new Map<string, { title: string; count: number; totalProgress: number }>();
  for (const ud of userDecks ?? []) {
    const title = (ud.deck as { title?: string } | null)?.title ?? ud.deck_id;
    const existing = deckMap.get(ud.deck_id) ?? { title, count: 0, totalProgress: 0 };
    deckMap.set(ud.deck_id, {
      title,
      count: existing.count + 1,
      totalProgress: existing.totalProgress + (ud.progress_percent ?? 0),
    });
  }
  const popularDecks = [...deckMap.entries()]
    .map(([, v]) => ({ ...v, avg: Math.round(v.totalProgress / v.count) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-2xl font-extrabold">📊 Thống kê</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: "Tổng users", value: totalUsers ?? 0 },
          { label: "Tổng decks", value: totalDecks ?? 0 },
          { label: "Tiến độ TB", value: `${avgProgress}%` },
          { label: "Từ đã học", value: totalLearned },
          { label: "Streak cao nhất", value: `${maxStreak} ngày` },
          { label: "Lượt học", value: userDecks?.length ?? 0 },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border-2 border-gray-100 bg-white p-4 text-center">
            <div className="text-2xl font-extrabold text-brand-red">{s.value}</div>
            <div className="mt-0.5 text-xs text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border-2 border-gray-100 bg-white p-5">
        <h2 className="mb-4 text-lg font-bold">🔥 Bộ đề phổ biến nhất</h2>
        {popularDecks.length === 0 ? (
          <p className="text-sm text-gray-400">Chưa có dữ liệu</p>
        ) : (
          <div className="space-y-4">
            {popularDecks.map((d, i) => (
              <div key={i}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-semibold">{d.title}</span>
                  <span className="text-gray-400">{d.count} người học · TB {d.avg}%</span>
                </div>
                <Progress value={d.avg} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
