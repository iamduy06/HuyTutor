"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, Sparkles, BookOpen } from "lucide-react";
import { cn, getCefrColor } from "@/lib/utils";
import type { Flashcard as FlashcardType } from "@/types";
import { useLearningStore } from "@/features/learning/store";
import { Flashcard } from "@/components/flashcard/Flashcard";
import { Controls } from "@/components/flashcard/Controls";
import { Progress } from "@/components/flashcard/Progress";
import { Button } from "@/components/ui/button";
import { FACEBOOK_URL } from "@/lib/constants";

interface WorkspaceProps {
  cards: FlashcardType[];
  deckTitle: string;
  deckDesc?: string;
  isDemo?: boolean;
}

export function Workspace({
  cards,
  deckTitle,
  deckDesc,
  isDemo = false,
}: WorkspaceProps) {
  const {
    currentIndex,
    mode,
    setCurrentIndex,
    setIsFlipped,
    toggleMode,
    reset,
  } = useLearningStore();

  const isKid = mode === "kid";

  // Reset index when deck changes
  useEffect(() => {
    reset();
  }, [cards, reset]);

  // Clamp index to valid range
  const safeIndex = Math.min(currentIndex, cards.length - 1);
  const card = cards[safeIndex];

  function goTo(index: number) {
    const clamped = Math.max(0, Math.min(index, cards.length - 1));
    setCurrentIndex(clamped);
    setIsFlipped(false);
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
        <BookOpen className="w-12 h-12 opacity-30" />
        <p className="text-lg font-semibold">Bộ đề chưa có từ nào.</p>
        <Button variant="brand-outline" asChild>
          <Link href="/dashboard">← Quay lại Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col min-h-[calc(100vh-62px)]",
        isKid && "kid-mode"
      )}
    >
      {/* Demo banner */}
      {isDemo && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2.5 text-center text-sm text-yellow-800 flex items-center justify-center gap-3 flex-wrap">
          <span>
            ⚠️ Bạn đang xem{" "}
            <strong>bản demo</strong> — tối đa 10 từ.
          </span>
          <Button variant="brand" size="sm" asChild className="rounded-full h-7 text-xs px-3">
            <Link href={FACEBOOK_URL} target="_blank">
              💬 Liên hệ gia hạn
            </Link>
          </Button>
        </div>
      )}

      {/* Header bar */}
      <div className="flex items-center justify-between px-4 md:px-8 py-3 bg-white border-b-2 border-[#f0e0e7]">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
        </Button>

        <div className="text-center flex-1 min-w-0 px-2">
          <h1
            className={cn(
              "font-extrabold text-brand truncate",
              isKid ? "text-2xl" : "text-xl"
            )}
          >
            {deckTitle}
          </h1>
          {deckDesc && (
            <p className="text-xs text-muted-foreground truncate hidden sm:block">
              {deckDesc}
            </p>
          )}
        </div>

        {/* Mode toggle */}
        <button
          onClick={toggleMode}
          aria-label={isKid ? "Chuyển sang Standard mode" : "Chuyển sang Kid mode"}
          title={isKid ? "Standard Mode" : "Kid Mode"}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all",
            isKid
              ? "bg-yellow-100 border-yellow-300 text-yellow-700 hover:bg-yellow-200"
              : "bg-brand-light border-brand-mid text-brand hover:bg-brand-mid"
          )}
        >
          <Sparkles className="w-3 h-3" />
          {isKid ? "🎨 Kid" : "📚 Standard"}
        </button>
      </div>

      {/* Body: sidebar-left + main + sidebar-right */}
      <div className="flex flex-1 min-h-0">
        {/* Left sidebar — word list (desktop) */}
        <nav className="hidden lg:flex flex-col w-[230px] flex-shrink-0 bg-white border-r-2 border-[#f0e0e7] overflow-y-auto">
          <div className="px-4 py-3 border-b border-[#f0e0e7]">
            <span className="text-brand font-extrabold text-sm">
              📋 Danh sách từ
            </span>
          </div>
          <div className="flex-1 overflow-y-auto py-2 px-2">
            {cards.map((c, i) => (
              <button
                key={c.id}
                onClick={() => goTo(i)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left mb-1 transition-all border-2",
                  i === safeIndex
                    ? "bg-brand text-white border-brand"
                    : "bg-[#f8f9fa] border-transparent hover:bg-[#ffe5ed] hover:border-brand"
                )}
              >
                <span
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] flex-shrink-0",
                    i === safeIndex ? "bg-white text-brand" : "bg-brand text-white"
                  )}
                >
                  {i + 1}
                </span>
                <span className="font-semibold text-sm flex-1 truncate">
                  {c.content.word}
                </span>
                {c.content.cefr && (
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded font-bold flex-shrink-0",
                      i === safeIndex
                        ? "bg-white/20 text-white"
                        : getCefrColor(c.content.cefr)
                    )}
                  >
                    {c.content.cefr}
                  </span>
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* Main */}
        <main className="flex-1 flex flex-col items-center overflow-y-auto">
          <div
            className={cn(
              "w-full flex flex-col items-center px-4 py-8 gap-6",
              isKid ? "max-w-2xl" : "max-w-[860px]"
            )}
          >
            {/* Card */}
            <Flashcard content={card.content} isKid={isKid} />

            {/* Progress */}
            <Progress current={safeIndex} total={cards.length} className="px-2" />

            {/* Controls */}
            <Controls
              onPrev={() => goTo(safeIndex - 1)}
              onNext={() => goTo(safeIndex + 1)}
              canPrev={safeIndex > 0}
              canNext={safeIndex < cards.length - 1}
              onJump={goTo}
              total={cards.length}
            />
          </div>
        </main>

        {/* Right sidebar — unit list (desktop) */}
        <aside className="hidden lg:flex flex-col w-[230px] flex-shrink-0 bg-white border-l-2 border-[#f0e0e7] overflow-y-auto">
          <div className="px-4 py-3 border-b border-[#f0e0e7]">
            <span className="text-brand font-extrabold text-sm">
              📚 Thông tin bộ đề
            </span>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <div className="p-3 rounded-xl bg-brand-light border-2 border-brand-mid">
              <div className="font-extrabold text-brand text-sm mb-1">
                {deckTitle}
              </div>
              {deckDesc && (
                <div className="text-xs text-muted-foreground leading-relaxed">
                  {deckDesc}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tổng số từ</span>
                <span className="font-bold text-brand">{cards.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Đang xem</span>
                <span className="font-bold">{safeIndex + 1}</span>
              </div>
              {isDemo && (
                <div className="mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
                  🔒 Demo — 10 từ đầu tiên
                </div>
              )}
            </div>

            {/* CEFR distribution */}
            <div className="mt-2">
              <div className="text-xs font-semibold text-muted-foreground mb-2">
                Phân bố CEFR
              </div>
              {(() => {
                const dist: Record<string, number> = {};
                cards.forEach((c) => {
                  if (c.content.cefr) {
                    dist[c.content.cefr] = (dist[c.content.cefr] ?? 0) + 1;
                  }
                });
                return Object.entries(dist).map(([level, count]) => (
                  <div key={level} className="flex items-center gap-2 mb-1">
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full",
                        getCefrColor(level)
                      )}
                    >
                      {level}
                    </span>
                    <div className="flex-1 h-1.5 bg-[#f0e0e7] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand rounded-full"
                        style={{ width: `${(count / cards.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground w-4 text-right">
                      {count}
                    </span>
                  </div>
                ));
              })()}
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile bottom nav */}
      <div className="lg:hidden sticky bottom-0 bg-white border-t-2 border-[#f0e0e7] px-4 py-2 flex items-center justify-between gap-2 z-10">
        <Button
          variant="brand"
          size="sm"
          onClick={() => goTo(safeIndex - 1)}
          disabled={safeIndex === 0}
          className="rounded-full disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4" />
          Trước
        </Button>

        <span className="text-sm font-semibold text-[#495057]">
          {safeIndex + 1} / {cards.length}
        </span>

        <Button
          variant="brand"
          size="sm"
          onClick={() => goTo(safeIndex + 1)}
          disabled={safeIndex === cards.length - 1}
          className="rounded-full disabled:opacity-40"
        >
          Tiếp
          <ChevronLeft className="w-4 h-4 rotate-180" />
        </Button>
      </div>
    </div>
  );
}
