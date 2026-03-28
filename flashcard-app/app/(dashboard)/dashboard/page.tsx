import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/services/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";
import { DeckCard } from "@/components/flashcard/DeckCard";
import { Progress } from "@/components/ui/progress";
import { isExpired, formatDate } from "@/lib/utils";
import { Flame, BookOpen, Trophy, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const [{ data: profile }, { data: userDecks }, { data: allDecks }] = await Promise.all([
    admin.from("users").select("*").eq("id", user.id).single(),
    admin.from("user_decks")
      .select("*, deck:decks(id, title, description, level, flashcards(count))")
      .eq("user_id", user.id)
      .order("last_studied_at", { ascending: false, nullsFirst: false }),
    admin.from("decks")
      .select("id, title, description, level, flashcards(count)")
      .order("created_at"),
  ]);

  const myDeckIds = new Set((userDecks ?? []).map((ud: any) => ud.deck_id));
  const explorableDecks = (allDecks ?? [])
    .filter((d: any) => !myDeckIds.has(d.id))
    .slice(0, 3)
    .map((d: any) => ({ ...d, flashcard_count: d.flashcards?.[0]?.count ?? 0 }));

  const totalStreak = (userDecks ?? []).reduce((s: number, ud: any) => Math.max(s, ud.streak || 0), 0);
  const totalLearned = (userDecks ?? []).reduce((s: number, ud: any) => s + (ud.learned_count || 0), 0);
  const activeDecks = (userDecks ?? []).filter((ud: any) => !isExpired(ud.expired_at)).length;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-[5%] py-10">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#1a1a2e]">
          Xin chào, <span className="text-brand">{profile?.email?.split("@")[0]}</span> 👋
        </h1>
        <p className="text-muted-foreground mt-1">Tiếp tục hành trình học từ vựng của bạn</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { icon: <Flame className="w-5 h-5" />, label: "Streak cao nhất", value: `${totalStreak} ngày`, color: "text-orange-500" },
          { icon: <BookOpen className="w-5 h-5" />, label: "Bộ đề đang học", value: `${activeDecks}`, color: "text-blue-500" },
          { icon: <Trophy className="w-5 h-5" />, label: "Từ đã học", value: `${totalLearned}`, color: "text-brand" },
          { icon: <Clock className="w-5 h-5" />, label: "Ngày tham gia", value: formatDate(profile?.created_at ?? ""), color: "text-green-500" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-4 flex flex-col gap-2">
            <div className={`${stat.color}`}>{stat.icon}</div>
            <div className="text-2xl font-extrabold text-[#1a1a2e]">{stat.value}</div>
            <div className="text-xs text-muted-foreground font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* My Decks */}
      {(userDecks ?? []).length > 0 ? (
        <section className="mb-10">
          <h2 className="text-xl font-extrabold text-[#1a1a2e] mb-5">📖 Bộ đề của tôi</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(userDecks ?? []).map((ud: any) => {
              const deck = ud.deck;
              if (!deck) return null;
              const expired = isExpired(ud.expired_at);
              const deckFormatted = { ...deck, flashcard_count: deck.flashcards?.[0]?.count ?? 0 };
              return (
                <div key={ud.id} className="relative">
                  {expired && (
                    <div className="absolute -top-2 -right-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      Hết hạn
                    </div>
                  )}
                  <DeckCard
                    deck={deckFormatted}
                    href={expired ? `/decks/${deck.id}` : `/learning/${deck.id}`}
                    ctaLabel={expired ? "Xem demo" : "Học tiếp"}
                    showProgress
                    progressPercent={ud.progress_percent}
                  />
                  <div className="mt-1 px-1">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>🔥 Streak: {ud.streak} ngày</span>
                      <span>✅ {ud.learned_count} từ</span>
                    </div>
                    {ud.expired_at && (
                      <div className={`text-xs font-medium ${expired ? "text-red-500" : "text-green-600"}`}>
                        {expired ? "⛔" : "✅"} Hạn: {new Date(ud.expired_at).toLocaleDateString("vi-VN")}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <div className="mb-10 bg-white rounded-2xl border-2 border-dashed border-[#f0e0e7] p-10 text-center">
          <div className="text-4xl mb-3">📚</div>
          <h3 className="font-bold text-[#1a1a2e] mb-2">Bạn chưa có bộ đề nào</h3>
          <p className="text-muted-foreground text-sm mb-4">Liên hệ admin để được cấp quyền truy cập bộ đề</p>
          <Button variant="brand" asChild><Link href="/decks">Xem bộ đề</Link></Button>
        </div>
      )}

      {/* Explore more */}
      {explorableDecks.length > 0 && (
        <section>
          <h2 className="text-xl font-extrabold text-[#1a1a2e] mb-5">🔍 Khám phá thêm</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {explorableDecks.map((deck: any) => (
              <DeckCard key={deck.id} deck={deck} href={`/decks/${deck.id}`} ctaLabel="Học thử" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
