import { createClient } from "@/services/supabase/server";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/common/SiteHeader";
import { Progress } from "@/components/ui/Progress";
import { isExpired, formatDate, cefrColor } from "@/lib/utils";
import { countWords, normalizeUnits } from "@/types";
import { BookOpen, Flame, CheckCircle, Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

async function getData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: appUser }, { data: userDecks }] = await Promise.all([
    supabase.from("users").select("*").eq("id", user.id).single(),
    supabase
      .from("user_decks")
      .select("*, deck:decks(id, title, description, level, flashcards(content))")
      .eq("user_id", user.id),
  ]);

  // Attach word_count to each userDeck
  const enriched = (userDecks ?? []).map((ud) => {
    const flashcards = ud.deck?.flashcards ?? [];
    const word_count = Array.isArray(flashcards)
      ? flashcards.reduce((acc: number, fc: { content: unknown }) => acc + countWords(fc.content as Parameters<typeof countWords>[0]), 0)
      : 0;
    return { ...ud, word_count };
  });

  return { user, appUser, userDecks: enriched };
}

export default async function DashboardPage() {
  const { user, userDecks } = await getData();

  const totalStreak = userDecks.length ? Math.max(...userDecks.map((ud) => ud.streak ?? 0)) : 0;
  const avgProgress = userDecks.length
    ? Math.round(userDecks.reduce((a, b) => a + (b.progress_percent ?? 0), 0) / userDecks.length)
    : 0;
  const totalLearned = userDecks.reduce((a, b) => a + (b.learned_count ?? 0), 0);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">

        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Xin chào, <span className="text-brand-red">{user.email?.split("@")[0]}</span>! 👋
          </h1>
          <p className="mt-1 text-gray-500">Tiếp tục hành trình học tiếng Anh của bạn</p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { icon: <Flame className="h-6 w-6 text-orange-500" />, label: "Streak", value: `${totalStreak} ngày`, bg: "bg-orange-50" },
            { icon: <CheckCircle className="h-6 w-6 text-green-500" />, label: "Đã học", value: `${totalLearned} từ`, bg: "bg-green-50" },
            { icon: <BookOpen className="h-6 w-6 text-brand-red" />, label: "Tiến độ TB", value: `${avgProgress}%`, bg: "bg-brand-red-light" },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} flex items-center gap-4 rounded-2xl p-5`}>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">{s.icon}</div>
              <div>
                <div className="text-2xl font-extrabold">{s.value}</div>
                <div className="text-sm text-gray-500">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* My Decks */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-extrabold">📚 Bộ đề của tôi</h2>
          <Link href="/profile"><Button variant="outline" size="sm">Hồ sơ</Button></Link>
        </div>

        {userDecks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-16 text-center">
            <div className="mb-3 text-5xl">📭</div>
            <h3 className="mb-1 text-lg font-bold">Chưa có bộ đề nào</h3>
            <p className="mb-4 text-sm text-gray-400">Liên hệ Huy Tutor để được cấp quyền truy cập</p>
            <div className="flex gap-3">
              <Link href="/decks"><Button variant="outline">Xem demo</Button></Link>
              <a href="https://web.facebook.com/huytutor" target="_blank" rel="noopener noreferrer">
                <Button>Liên hệ ngay</Button>
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {userDecks.map((ud) => {
              const deck = ud.deck;
              if (!deck) return null;
              const expired = isExpired(ud.expired_at);
              return (
                <div key={ud.id} className="rounded-2xl border-2 border-gray-100 bg-white p-5 transition-all hover:border-brand-red">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-0.5 flex items-center gap-2">
                        <h3 className="font-bold text-gray-900">{deck.title}</h3>
                        {deck.level && (
                          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${cefrColor(deck.level)}`}>
                            {deck.level}
                          </span>
                        )}
                      </div>
                      {deck.description && (
                        <p className="text-xs text-gray-400 line-clamp-1">{deck.description}</p>
                      )}
                    </div>
                    {expired
                      ? <Lock className="ml-2 h-4 w-4 flex-shrink-0 text-gray-300" />
                      : <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">Còn hạn</span>
                    }
                  </div>

                  <div className="mb-3">
                    <div className="mb-1 flex justify-between text-xs text-gray-400">
                      <span>Tiến độ</span><span>{ud.progress_percent ?? 0}%</span>
                    </div>
                    <Progress value={ud.progress_percent ?? 0} />
                  </div>

                  <div className="mb-3 flex items-center justify-between text-xs text-gray-400">
                    <span>📝 {ud.word_count} từ · ✅ {ud.learned_count} đã học</span>
                    <span>🔥 {ud.streak} ngày</span>
                  </div>

                  {ud.expired_at && (
                    <p className={`mb-3 text-xs ${expired ? "text-red-500" : "text-green-600"}`}>
                      {expired ? "⛔ Hết hạn: " : "✅ Đến: "}{formatDate(ud.expired_at)}
                    </p>
                  )}

                  {expired ? (
                    <a href="https://web.facebook.com/huytutor" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="w-full">Gia hạn</Button>
                    </a>
                  ) : (
                    <Link href={`/learning/${deck.id}`}>
                      <Button size="sm" className="w-full">Học ngay →</Button>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <footer className="border-t bg-white py-5 text-center text-xs text-gray-400">
        © Bản quyền thuộc về <strong>Huy Tutor</strong>
      </footer>
    </div>
  );
}
