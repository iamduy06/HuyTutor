import { createClient } from "@/services/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isExpired, formatDate, cefrColor } from "@/lib/utils";
import { BookOpen, Flame, CheckCircle, Lock } from "lucide-react";

async function getDashboardData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: appUser }, { data: userDecks }] = await Promise.all([
    supabase.from("users").select("*").eq("id", user.id).single(),
    supabase
      .from("user_decks")
      .select(`*, deck:decks(id, title, description, level, flashcards(id, content))`)
      .eq("user_id", user.id),
  ]);

  const decksWithCount = (userDecks ?? []).map((ud) => ({
    ...ud,
    word_count: Array.isArray(ud.deck?.flashcards)
      ? ud.deck.flashcards.reduce(
          (acc: number, fc: { content?: { vocabulary?: unknown[] } }) =>
            acc + (fc?.content?.vocabulary?.length ?? 0),
          0
        )
      : 0,
  }));

  return { user, appUser, userDecks: decksWithCount };
}

export default async function DashboardPage() {
  const { user, appUser, userDecks } = await getDashboardData();

  const totalStreak = Math.max(...(userDecks.map((ud) => ud.streak) ?? [0]));
  const avgProgress = userDecks.length
    ? Math.round(userDecks.reduce((a, b) => a + (b.progress_percent ?? 0), 0) / userDecks.length)
    : 0;
  const totalLearned = userDecks.reduce((a, b) => a + (b.learned_count ?? 0), 0);

  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-1">
          Xin chào, <span className="text-brand-red">{user.email?.split("@")[0]}</span>! 👋
        </h1>
        <p className="text-muted-foreground">Tiếp tục hành trình học tiếng Anh của bạn</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { icon: <Flame className="h-6 w-6 text-orange-500" />, label: "Streak", value: `${totalStreak} ngày`, bg: "bg-orange-50" },
          { icon: <CheckCircle className="h-6 w-6 text-green-500" />, label: "Đã học", value: `${totalLearned} từ`, bg: "bg-green-50" },
          { icon: <BookOpen className="h-6 w-6 text-brand-red" />, label: "Tiến độ TB", value: `${avgProgress}%`, bg: "bg-brand-red-light" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-5 flex items-center gap-4`}>
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              {s.icon}
            </div>
            <div>
              <div className="font-extrabold text-2xl">{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* My Decks */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-extrabold">📚 Bộ đề của tôi</h2>
        <Link href="/profile">
          <Button variant="outline" size="sm">Hồ sơ</Button>
        </Link>
      </div>

      {userDecks.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-border">
          <div className="text-5xl mb-3">📭</div>
          <h3 className="font-bold text-lg mb-1">Chưa có bộ đề nào</h3>
          <p className="text-muted-foreground text-sm mb-4">Liên hệ Huy Tutor để được cấp quyền truy cập</p>
          <div className="flex justify-center gap-3">
            <Link href="/decks"><Button variant="outline">Xem bộ đề demo</Button></Link>
            <a href="https://web.facebook.com/huytutor" target="_blank" rel="noopener noreferrer">
              <Button>Liên hệ ngay</Button>
            </a>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {userDecks.map((ud) => {
            const expired = isExpired(ud.expired_at);
            const deck = ud.deck;
            if (!deck) return null;
            return (
              <div key={ud.id} className="bg-white rounded-2xl border-2 border-border p-5 hover:border-brand-red transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900">{deck.title}</h3>
                      {deck.level && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cefrColor(deck.level)}`}>
                          {deck.level}
                        </span>
                      )}
                    </div>
                    {deck.description && (
                      <p className="text-muted-foreground text-xs line-clamp-1">{deck.description}</p>
                    )}
                  </div>
                  {expired ? (
                    <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                  ) : (
                    <Badge variant="default" className="text-xs flex-shrink-0 ml-2">Còn hạn</Badge>
                  )}
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Tiến độ</span>
                    <span>{ud.progress_percent ?? 0}%</span>
                  </div>
                  <Progress value={ud.progress_percent ?? 0} className="h-2" />
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <span>📝 {ud.word_count} từ · ✅ {ud.learned_count} đã học</span>
                  <span>🔥 {ud.streak} ngày</span>
                </div>

                {ud.expired_at && (
                  <p className={`text-xs mb-3 ${expired ? "text-red-500" : "text-green-600"}`}>
                    {expired ? "⛔ Hết hạn:" : "✅ Hết hạn:"} {formatDate(ud.expired_at)}
                  </p>
                )}

                {expired ? (
                  <a href="https://web.facebook.com/huytutor" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full" size="sm">Gia hạn</Button>
                  </a>
                ) : (
                  <Link href={`/learning/${deck.id}`}>
                    <Button className="w-full" size="sm">Học ngay →</Button>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
