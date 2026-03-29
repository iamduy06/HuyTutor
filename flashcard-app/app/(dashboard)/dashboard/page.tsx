import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";
import { isExpired, formatDate, normaliseUnits, countWords } from "@/lib/utils";
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
      .select(`id, deck_id, progress_percent, learned_count, streak, expired_at,
               deck:decks(id, title, description, level)`)
      .eq("user_id", user.id)
      .order("deck_id"),
  ]);

  // Word counts per deck
  const deckIds = (userDecks ?? []).map((ud: any) => ud.deck_id);
  const { data: flashcardRows } = deckIds.length > 0
    ? await admin.from("flashcards").select("deck_id, content").in("deck_id", deckIds)
    : { data: [] };

  const wordCountMap: Record<string, number> = {};
  (flashcardRows ?? []).forEach((r: any) => {
    wordCountMap[r.deck_id] = (wordCountMap[r.deck_id] ?? 0) +
      countWords(r as unknown as FlashcardRow);
  });

  const maxStreak   = (userDecks ?? []).reduce((s: number, ud: any) => Math.max(s, ud.streak ?? 0), 0);
  const totalLearned = (userDecks ?? []).reduce((s: number, ud: any) => s + (ud.learned_count ?? 0), 0);
  const activeDecks = (userDecks ?? []).filter((ud: any) => !isExpired(ud.expired_at)).length;

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
          { icon: <Flame className="w-5 h-5" />,     label: "Streak",         value: `${maxStreak} ngày`, color: "text-orange-500" },
          { icon: <BookOpen className="w-5 h-5" />,   label: "Đang học",       value: `${activeDecks}`,    color: "text-blue-500" },
          { icon: <Trophy className="w-5 h-5" />,     label: "Từ đã học",      value: `${totalLearned}`,   color: "text-brand" },
          { icon: <Clock className="w-5 h-5" />,      label: "Tham gia",       value: formatDate(profile?.created_at ?? ""), color: "text-green-500" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-4 flex flex-col gap-2">
            <div className={s.color}>{s.icon}</div>
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
            {(userDecks ?? []).map((ud: any) => {
              const deck    = ud.deck;
              const expired = isExpired(ud.expired_at);
              const words   = wordCountMap[ud.deck_id] ?? 0;
              if (!deck) return null;
              return (
                <div key={ud.id} className={`bg-white rounded-2xl border-2 p-5 flex flex-col gap-3 transition-all hover:shadow-md ${expired ? "border-red-200" : "border-[#f0e0e7] hover:border-brand"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-[#1a1a2e]">{deck.title}</h3>
                      {deck.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{deck.description}</p>}
                    </div>
                    {expired
                      ? <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold flex-shrink-0">Hết hạn</span>
                      : <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold flex-shrink-0">Còn hạn</span>
                    }
                  </div>
                  <div className="text-xs text-muted-foreground">📝 {words} từ • 🔥 Streak: {ud.streak ?? 0} ngày</div>
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Tiến độ</span><span>{ud.progress_percent ?? 0}%</span>
                    </div>
                    <div className="h-1.5 bg-[#f0e0e7] rounded-full overflow-hidden">
                      <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${ud.progress_percent ?? 0}%` }} />
                    </div>
                  </div>
                  {ud.expired_at && (
                    <div className={`text-xs font-medium ${expired ? "text-red-500" : "text-green-600"}`}>
                      {expired ? "⛔" : "✅"} Hạn: {new Date(ud.expired_at).toLocaleDateString("vi-VN")}
                    </div>
                  )}
                  {expired
                    ? <Button variant="outline" size="sm" asChild className="w-full"><Link href={FACEBOOK_URL} target="_blank">Gia hạn</Link></Button>
                    : <Button variant="brand" size="sm" asChild className="w-full"><Link href={`/learning/${deck.id}`}>Học ngay →</Link></Button>
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
