import { createAdminClient } from "@/services/supabase/admin";
import { Users, BookOpen, TrendingUp, Award, Flame } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const supabase = createAdminClient();

  const [
    { count: totalUsers },
    { count: totalDecks },
    { data: progressData },
    { data: deckStats },
    { data: streakData },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("decks").select("*", { count: "exact", head: true }),
    supabase.from("user_decks").select("progress_percent"),
    supabase.from("user_decks").select("deck_id, deck:decks(title), progress_percent, learned_count").order("deck_id"),
    supabase.from("user_decks").select("streak").order("streak", { ascending: false }).limit(1),
  ]);

  const avgProgress = progressData?.length
    ? Math.round(progressData.reduce((s: number, r: any) => s + (r.progress_percent || 0), 0) / progressData.length)
    : 0;

  const maxStreak = (streakData?.[0] as any)?.streak ?? 0;

  // Group by deck
  const deckMap: Record<string, { title: string; userCount: number; totalProgress: number; totalLearned: number }> = {};
  (deckStats ?? []).forEach((r: any) => {
    const id = r.deck_id;
    if (!deckMap[id]) deckMap[id] = { title: r.deck?.title ?? id, userCount: 0, totalProgress: 0, totalLearned: 0 };
    deckMap[id].userCount++;
    deckMap[id].totalProgress += r.progress_percent || 0;
    deckMap[id].totalLearned += r.learned_count || 0;
  });
  const popularDecks = Object.values(deckMap)
    .map((d) => ({ ...d, avgProgress: d.userCount ? Math.round(d.totalProgress / d.userCount) : 0 }))
    .sort((a, b) => b.userCount - a.userCount);

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-extrabold text-[#1a1a2e] mb-6">📊 Thống kê</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: <Users className="w-5 h-5" />, label: "Tổng người dùng", value: totalUsers ?? 0, color: "text-blue-500", bg: "bg-blue-50" },
          { icon: <BookOpen className="w-5 h-5" />, label: "Flashcard", value: totalDecks ?? 0, color: "text-brand", bg: "bg-brand-light" },
          { icon: <TrendingUp className="w-5 h-5" />, label: "Tiến độ TB", value: `${avgProgress}%`, color: "text-green-600", bg: "bg-green-50" },
          { icon: <Flame className="w-5 h-5" />, label: "Streak cao nhất", value: `${maxStreak} ngày`, color: "text-orange-500", bg: "bg-orange-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-5">
            <div className={`w-10 h-10 ${s.bg} ${s.color} rounded-xl flex items-center justify-center mb-3`}>{s.icon}</div>
            <div className="text-2xl font-extrabold text-[#1a1a2e]">{s.value}</div>
            <div className="text-xs text-muted-foreground font-medium mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Popular decks */}
      <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-6">
        <h2 className="font-bold text-lg text-[#1a1a2e] mb-5">🏆 Bộ Flashcard phổ biến</h2>
        {popularDecks.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">Chưa có dữ liệu</p>
        ) : (
          <div className="flex flex-col gap-4">
            {popularDecks.map((deck, i) => (
              <div key={deck.title} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-brand-light text-brand flex items-center justify-center font-extrabold text-sm flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-sm text-[#1a1a2e] truncate">{deck.title}</span>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0 ml-3">
                      <span>👥 {deck.userCount} user</span>
                      <span>📝 {deck.totalLearned} từ</span>
                      <span className="font-bold text-brand">{deck.avgProgress}%</span>
                    </div>
                  </div>
                  <Progress value={deck.avgProgress} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
