import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hasFullAccess, formatDate } from "@/lib/utils";
import { getApiUrl } from "@/lib/apiUrl";
import { Flame, BookOpen, Trophy, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FACEBOOK_URL } from "@/lib/constants";

const GAMES = [
  { href: "/game/listening",       icon: "🎧", title: "Nghe & Viết",       desc: "Nghe phát âm, gõ lại từ tiếng Anh" },
  { href: "/game/multiple-choice", icon: "📝", title: "Chọn Nghĩa",        desc: "4 đáp án, chọn nghĩa đúng nhất" },
  { href: "/game/matching",        icon: "🔗", title: "Nối Từ",            desc: "Nối từ tiếng Anh với nghĩa" },
  { href: "/game/syn-ant",         icon: "↔️", title: "Đồng/Trái Nghĩa",  desc: "Nối từ đồng nghĩa, trái nghĩa" },
] as const;

export const dynamic = "force-dynamic";


export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) redirect("/login");

  const apiUrl = getApiUrl();
  let dashboardData: any = null;

  try {
    const res = await fetch(`${apiUrl}/me/dashboard`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });

    if (res.ok) {
      dashboardData = await res.json();
    } else if (res.status === 401) {
      redirect("/login");
    }
  } catch (err: any) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    console.error("[Dashboard] Failed to fetch /me/dashboard:", err);
  }

  const profile = dashboardData?.profile ?? { email: session.user.email };
  const filteredUserDecks = dashboardData?.userDecks ?? [];
  const extraPublicDecks = dashboardData?.extraPublicDecks ?? [];
  const wordCountMap = dashboardData?.wordCountMap ?? {};

  // Stats: count active = assigned có hạn + tất cả public
  const maxStreak = filteredUserDecks.reduce((s: number, ud: any) => Math.max(s, (ud.streak as number) ?? 0), 0);
  const totalLearned = filteredUserDecks.reduce((s: number, ud: any) => s + ((ud.learned_count as number) ?? 0), 0);
  
  const activeAssigned = filteredUserDecks.filter((ud: any) => {
    const levels = ud.deck?.access_level ?? {};
    if (levels.public === true || levels.auth === true) return true;
    return hasFullAccess(ud.expired_at as string | null);
  }).length;

  const activeCount = activeAssigned + extraPublicDecks.length;
  const totalDecks = filteredUserDecks.length + extraPublicDecks.length;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-[5%] py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#1a1a2e]">
          Xin chào, <span className="text-brand">{profile?.email?.split("@")[0]}</span> 👋
        </h1>
        <p className="text-muted-foreground mt-1">Tiếp tục hành trình học từ vựng</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { icon: <Flame className="w-5 h-5" />, label: "Streak cao nhất", value: `${maxStreak} ngày`, color: "text-orange-500", bg: "bg-orange-50" },
          { icon: <BookOpen className="w-5 h-5" />, label: "Đang học", value: `${activeCount}`, color: "text-blue-500", bg: "bg-blue-50" },
          { icon: <Trophy className="w-5 h-5" />, label: "Từ đã học", value: `${totalLearned}`, color: "text-brand", bg: "bg-brand-light" },
          { icon: <Clock className="w-5 h-5" />, label: "Tham gia", value: formatDate(profile?.created_at ?? ""), color: "text-green-500", bg: "bg-green-50" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-4 flex flex-col gap-2">
            <div className={`w-10 h-10 ${s.bg} ${s.color} rounded-xl flex items-center justify-center`}>{s.icon}</div>
            <div className="text-2xl font-extrabold text-[#1a1a2e]">{s.value}</div>
            <div className="text-xs text-muted-foreground font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* No decks at all */}
      {totalDecks === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-[#f0e0e7] p-10 text-center">
          <div className="text-4xl mb-3">📚</div>
          <h3 className="font-bold text-[#1a1a2e] mb-2">Bạn chưa có Flashcard nào</h3>
          <p className="text-muted-foreground text-sm mb-4">Liên hệ admin để được cấp quyền truy cập</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button variant="brand" asChild><Link href={FACEBOOK_URL} target="_blank">💬 Liên hệ</Link></Button>
          </div>
        </div>
      ) : (
        <>
          {/* ── Mục I: Luyện tập (Game modes) ── */}
          {filteredUserDecks.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xl font-extrabold text-[#1a1a2e] mb-5">🎮 Luyện tập</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {GAMES.map(game => (
                  <Link
                    key={game.href}
                    href={game.href}
                    className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-5 flex flex-col gap-3
                               hover:border-brand hover:shadow-md transition-all group"
                  >
                    <div className="text-4xl">{game.icon}</div>
                    <div>
                      <div className="font-extrabold text-[#1a1a2e] text-sm group-hover:text-brand transition-colors">
                        {game.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{game.desc}</div>
                    </div>
                    <div className="mt-auto text-xs font-bold text-brand group-hover:underline">
                      Chơi ngay →
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── Mục II: Học từ vựng ── */}
          <h2 className="text-xl font-extrabold text-[#1a1a2e] mb-5">📖 Bộ Flashcard của tôi</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

            {/* ── Assigned decks ── */}
            {filteredUserDecks.map((ud: any) => {
              const deck = ud.deck as any;
              const expired_at = ud.expired_at as string | null;
              const levels = deck?.access_level ?? {};
              const isFree = levels.public || levels.auth;
              // Free decks luôn active; restricted check expired_at
              const active = isFree || hasFullAccess(expired_at);
              const words = wordCountMap[ud.deck_id as string] ?? 0;
              if (!deck) return null;

              return (
                <DeckCard
                  key={ud.id as string}
                  title={deck.title}
                  description={deck.description}
                  accessLevel={deck.access_level}
                  active={active}
                  words={words}
                  streak={(ud.streak as number) ?? 0}
                  progressPercent={(ud.progress_percent as number) ?? 0}
                  expiredAt={isFree ? null : expired_at}  // public không show hạn
                  deckId={deck.id}
                  showExpiry={!isFree}
                  isAssigned={true}
                />
              );
            })}

            {/* ── Extra public decks (chưa được assign) ── */}
            {(extraPublicDecks ?? []).map((deck: any) => (
              <DeckCard
                key={deck.id}
                title={deck.title}
                description={deck.description}
                accessLevel={deck.access_level}
                active={true}
                words={wordCountMap[deck.id] ?? 0}
                streak={0}
                progressPercent={0}
                expiredAt={null}
                deckId={deck.id}
                showExpiry={false}
                isAssigned={false}
              />
            ))}

          </div>
        </>
      )}
    </div>
  );
}

// ── Inline DeckCard component for dashboard ──────────────────────────────────
interface DeckCardProps {
  title: string;
  description: string | null;
  accessLevel: any; // update to any for flexibility
  active: boolean;
  words: number;
  streak: number;
  progressPercent: number;
  expiredAt: string | null;
  deckId: string;
  showExpiry: boolean;
  isAssigned: boolean;
}

function DeckCard({
  title, description, accessLevel, active, words, streak,
  progressPercent, expiredAt, deckId, showExpiry, isAssigned
}: DeckCardProps) {
  const levels = accessLevel ?? {};
  const isFree = levels.public === true || levels.auth === true;

  return (
    <div className={`bg-white rounded-2xl border-2 p-5 flex flex-col transition-all hover:shadow-md ${active ? "border-[#f0e0e7] hover:border-brand" : "border-red-200"
      }`}>
      {/* Title + badges */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3
          className="font-bold text-[#1a1a2e] text-sm leading-snug line-clamp-2 flex-1 min-w-0 cursor-default"
          title={title}
        >
          {title}
        </h3>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {isAssigned && levels.paid === true ? (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
              {active ? "Còn hạn" : "Hết hạn"}
            </span>
          ) : (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 whitespace-nowrap">
              🌐 Miễn phí
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3 flex-1">
        <div className="text-xs text-muted-foreground flex gap-3">
          <span>📝 {words} từ</span>
          {streak > 0 && <span>🔥 Streak: {streak} ngày</span>}
        </div>

        {progressPercent > 0 && (
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Tiến độ</span><span>{progressPercent}%</span>
            </div>
            <div className="h-1.5 bg-[#f0e0e7] rounded-full overflow-hidden">
              <div className="h-full bg-brand rounded-full transition-all"
                style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        )}

        {isAssigned && !active ? (
          <div className="text-xs text-red-500 font-bold bg-red-50 p-2 rounded-lg border border-red-100">
            ⚠️ Đã hết hạn. Vui lòng liên hệ để được hỗ trợ.
          </div>
        ) : (
          <>
            {showExpiry && expiredAt && (
              <div className={`text-xs font-medium ${active ? "text-green-600" : "text-red-500"}`}>
                {active ? "✅" : "⛔"} Hạn: {new Date(expiredAt).toLocaleDateString("vi-VN")}
              </div>
            )}
            {showExpiry && !expiredAt && (
              <div className="text-xs text-green-600 font-medium">♾️ Không giới hạn thời gian</div>
            )}
          </>
        )}
      </div>

      {/* Button */}
      <div className="mt-3">
        {active
          ? <Link href={`/learning/${deckId}`} className="flex w-full items-center justify-center gap-1 py-2 px-4 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-[#c0003a] transition-colors">
            Học ngay →
          </Link>
          : <a href={FACEBOOK_URL} target="_blank" rel="noreferrer" className="flex w-full items-center justify-center gap-1 py-2 px-4 rounded-lg border-2 border-[#f0e0e7] text-sm font-semibold hover:border-brand hover:text-brand transition-colors">
            💬 Gia hạn
          </a>
        }
      </div>
    </div>
  );
}
