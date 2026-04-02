import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";
import { hasFullAccess, formatDate, extractTabs } from "@/lib/utils";
import { Flame, BookOpen, Trophy, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FACEBOOK_URL } from "@/lib/constants";
import type { FlashcardRow } from "@/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const [{ data: profile }, { data: userDecks }] = await Promise.all([
    admin.from("users").select("*").eq("id", user.id).single(),
    admin
      .from("user_decks")
      .select("id, deck_id, progress_percent, learned_count, streak, expired_at, deck:decks(id, title, description, level)")
      .eq("user_id", user.id)
      .order("deck_id"),
  ]);

  // Word count map
  const deckIds = (userDecks ?? []).map((ud: Record<string, unknown>) => ud.deck_id as string);
  const { data: flashcardRows } = deckIds.length > 0
    ? await admin.from("flashcards").select("deck_id, content").in("deck_id", deckIds)
    : { data: [] };

  const wordCountMap: Record<string, number> = {};
  (flashcardRows ?? []).forEach((r: Record<string, unknown>) => {
    const tabs = extractTabs((r as unknown as FlashcardRow).content);
    const count = tabs.reduce((s, t) => s + (t.vocabulary?.length ?? 0), 0);
    wordCountMap[r.deck_id as string] = (wordCountMap[r.deck_id as string] ?? 0) + count;
  });

  const maxStreak    = (userDecks ?? []).reduce((s: number, ud: Record<string, unknown>) => Math.max(s, (ud.streak as number) ?? 0), 0);
  const totalLearned = (userDecks ?? []).reduce((s: number, ud: Record<string, unknown>) => s + ((ud.learned_count as number) ?? 0), 0);
  const activeCount  = (userDecks ?? []).filter((ud: Record<string, unknown>) => hasFullAccess(ud.expired_at as string | null)).length;

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
          { icon: <Flame className="w-5 h-5" />,   label: "Streak cao nhất", value: `${maxStreak} ngày`, color: "text-orange-500", bg: "bg-orange-50" },
          { icon: <BookOpen className="w-5 h-5" />, label: "Đang học",        value: `${activeCount}`,   color: "text-blue-500",   bg: "bg-blue-50" },
          { icon: <Trophy className="w-5 h-5" />,   label: "Từ đã học",      value: `${totalLearned}`,  color: "text-brand",      bg: "bg-brand-light" },
          { icon: <Clock className="w-5 h-5" />,    label: "Tham gia",        value: formatDate(profile?.created_at ?? ""), color: "text-green-500", bg: "bg-green-50" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-4 flex flex-col gap-2">
            <div className={`w-10 h-10 ${s.bg} ${s.color} rounded-xl flex items-center justify-center`}>{s.icon}</div>
            <div className="text-2xl font-extrabold text-[#1a1a2e]">{s.value}</div>
            <div className="text-xs text-muted-foreground font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* My decks */}
      {(userDecks ?? []).length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-[#f0e0e7] p-10 text-center">
          <div className="text-4xl mb-3">📚</div>
          <h3 className="font-bold text-[#1a1a2e] mb-2">Bạn chưa có bộ đề nào</h3>
          <p className="text-muted-foreground text-sm mb-4">Liên hệ admin để được cấp quyền truy cập</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button variant="brand-outline" asChild><Link href="/decks">Xem bộ đề</Link></Button>
            <Button variant="brand" asChild><Link href={FACEBOOK_URL} target="_blank">💬 Liên hệ</Link></Button>
          </div>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-extrabold text-[#1a1a2e] mb-5">📖 Bộ đề của tôi</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(userDecks ?? []).map((ud: Record<string, unknown>) => {
              const deck    = ud.deck as Record<string, string> | null;
              const expired_at = ud.expired_at as string | null;
              const active  = hasFullAccess(expired_at);
              const words   = wordCountMap[ud.deck_id as string] ?? 0;
              if (!deck) return null;

              return (
                <div key={ud.id as string} className={`bg-white rounded-2xl border-2 p-5 flex flex-col gap-3 transition-all hover:shadow-md ${active ? "border-[#f0e0e7] hover:border-brand" : "border-red-200"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[#1a1a2e] leading-snug" title={deck.title}>{deck.title}</h3>
                      {deck.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{deck.description}</p>}
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {active ? "Còn hạn" : "Hết hạn"}
                    </span>
                  </div>

                  <div className="text-xs text-muted-foreground flex gap-3">
                    <span>📝 {words} từ</span>
                    <span>🔥 Streak: {(ud.streak as number) ?? 0} ngày</span>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Tiến độ</span><span>{(ud.progress_percent as number) ?? 0}%</span>
                    </div>
                    <div className="h-1.5 bg-[#f0e0e7] rounded-full overflow-hidden">
                      <div className="h-full bg-brand rounded-full transition-all"
                        style={{ width: `${(ud.progress_percent as number) ?? 0}%` }} />
                    </div>
                  </div>

                  {expired_at && (
                    <div className={`text-xs font-medium ${active ? "text-green-600" : "text-red-500"}`}>
                      {active ? "✅" : "⛔"} Hạn: {new Date(expired_at).toLocaleDateString("vi-VN")}
                    </div>
                  )}
                  {!expired_at && (
                    <div className="text-xs text-green-600 font-medium">♾️ Không giới hạn thời gian</div>
                  )}

                  {active
                    ? <Button variant="brand" size="sm" asChild className="w-full"><Link href={`/learning/${deck.id}`}>Học ngay →</Link></Button>
                    : <Button variant="outline" size="sm" asChild className="w-full"><Link href={FACEBOOK_URL} target="_blank">💬 Gia hạn</Link></Button>
                  }
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
