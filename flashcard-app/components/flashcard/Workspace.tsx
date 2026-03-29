"use client";

import { useEffect, useCallback } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Sparkles, BookOpen, Loader2, AlertCircle } from "lucide-react";
import { cn, getCefrColor } from "@/lib/utils";
import type { FlashcardUnit, VocabItem } from "@/types";
import { useLearningStore } from "@/features/learning/store";
import { Flashcard } from "@/components/flashcard/Flashcard";
import { Controls } from "@/components/flashcard/Controls";
import { Progress } from "@/components/flashcard/Progress";
import { Button } from "@/components/ui/button";
import { FACEBOOK_URL } from "@/lib/constants";

interface DeckData {
  deck: { id: string; title: string; description: string | null };
  units: FlashcardUnit[];
  isDemo: boolean;
  totalWords: number;
}

async function fetchDeck(deckId: string): Promise<DeckData> {
  const res = await fetch(`/api/decks/${deckId}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Failed to load deck");
  }
  return res.json();
}

interface WorkspaceProps {
  deckId: string;
}

export function Workspace({ deckId }: WorkspaceProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["deck", deckId],
    queryFn: () => fetchDeck(deckId),
    staleTime: 5 * 60 * 1000,
  });

  const { currentIndex, mode, setCurrentIndex, setIsFlipped, toggleMode, reset } = useLearningStore();
  const isKid = mode === "kid";

  // Flatten all units → flat vocab list
  const allVocab: VocabItem[] = (data?.units ?? []).flatMap(u => u.vocabulary ?? []);
  const totalCards = allVocab.length;
  const safeIndex  = Math.min(currentIndex, Math.max(0, totalCards - 1));
  const currentItem = allVocab[safeIndex];

  useEffect(() => { reset(); }, [deckId, reset]);

  const goTo = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(idx, totalCards - 1));
    setCurrentIndex(clamped);
    setIsFlipped(false);
  }, [totalCards, setCurrentIndex, setIsFlipped]);

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-20 gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-brand" />
        <p className="text-muted-foreground">Đang tải bộ đề…</p>
      </div>
    );
  }

  // ── Error ──
  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-20 gap-3 text-muted-foreground">
        <AlertCircle className="w-10 h-10 text-destructive" />
        <p>{(error as Error)?.message ?? "Không thể tải bộ đề."}</p>
        <Button variant="brand-outline" asChild>
          <Link href="/dashboard">← Quay lại</Link>
        </Button>
      </div>
    );
  }

  // ── Empty ──
  if (totalCards === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-20 gap-3 text-muted-foreground">
        <BookOpen className="w-12 h-12 opacity-30" />
        <p className="text-lg font-semibold">Bộ đề chưa có từ nào.</p>
        <Button variant="brand-outline" asChild>
          <Link href="/dashboard">← Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col min-h-[calc(100vh-0px)]", isKid && "kid-mode")}>
      {/* Demo banner */}
      {data.isDemo && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-center text-sm text-yellow-800 flex items-center justify-center gap-3 flex-wrap">
          <span>⚠️ Bản demo — tối đa {totalCards} từ đầu tiên.</span>
          <Button variant="brand" size="sm" asChild className="rounded-full h-7 text-xs px-3">
            <Link href={FACEBOOK_URL} target="_blank">💬 Liên hệ gia hạn</Link>
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-8 py-3 bg-white border-b-2 border-[#f0e0e7]">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard"><ChevronLeft className="w-4 h-4" /><span className="hidden sm:inline">Dashboard</span></Link>
        </Button>
        <div className="text-center flex-1 min-w-0 px-2">
          <h1 className={cn("font-extrabold text-brand truncate", isKid ? "text-2xl" : "text-xl")}>
            {data.deck.title}
          </h1>
          {data.deck.description && (
            <p className="text-xs text-muted-foreground truncate hidden sm:block">{data.deck.description}</p>
          )}
        </div>
        <button onClick={toggleMode} aria-label="Toggle UI mode"
          className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all",
            isKid ? "bg-yellow-100 border-yellow-300 text-yellow-700" : "bg-brand-light border-brand-mid text-brand")}>
          <Sparkles className="w-3 h-3" />
          {isKid ? "🎨 Kid" : "📚 Standard"}
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Left sidebar */}
        <nav className="hidden lg:flex flex-col w-[230px] flex-shrink-0 bg-white border-r-2 border-[#f0e0e7] overflow-y-auto">
          <div className="px-4 py-3 border-b border-[#f0e0e7]">
            <span className="text-brand font-extrabold text-sm">📋 Danh sách từ</span>
          </div>
          <div className="flex-1 overflow-y-auto py-2 px-2">
            {allVocab.map((v, i) => (
              <button key={i} onClick={() => goTo(i)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left mb-1 transition-all border-2",
                  i === safeIndex
                    ? "bg-brand text-white border-brand"
                    : "bg-[#f8f9fa] border-transparent hover:bg-[#ffe5ed] hover:border-brand"
                )}>
                <span className={cn("w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] flex-shrink-0",
                  i === safeIndex ? "bg-white text-brand" : "bg-brand text-white")}>
                  {i + 1}
                </span>
                <span className="font-semibold text-sm flex-1 truncate">{v.word}</span>
                {v.cefr && (
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-bold flex-shrink-0",
                    i === safeIndex ? "bg-white/20 text-white" : getCefrColor(v.cefr))}>
                    {v.cefr}
                  </span>
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* Main */}
        <main className="flex-1 flex flex-col items-center overflow-y-auto">
          <div className={cn("w-full flex flex-col items-center px-4 py-8 gap-6", isKid ? "max-w-2xl" : "max-w-[860px]")}>
            <Flashcard item={currentItem} isKid={isKid} />
            <Progress current={safeIndex} total={totalCards} />
            <Controls
              onPrev={() => goTo(safeIndex - 1)}
              onNext={() => goTo(safeIndex + 1)}
              canPrev={safeIndex > 0}
              canNext={safeIndex < totalCards - 1}
              onJump={goTo}
              total={totalCards}
            />
          </div>
        </main>

        {/* Right sidebar */}
        <aside className="hidden lg:flex flex-col w-[230px] flex-shrink-0 bg-white border-l-2 border-[#f0e0e7] overflow-y-auto">
          <div className="px-4 py-3 border-b border-[#f0e0e7]">
            <span className="text-brand font-extrabold text-sm">📚 Bộ đề</span>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <div className="p-3 rounded-xl bg-brand-light border-2 border-brand-mid">
              <div className="font-extrabold text-brand text-sm mb-1">{data.deck.title}</div>
              {data.deck.description && (
                <div className="text-xs text-muted-foreground leading-relaxed">{data.deck.description}</div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tổng số từ</span>
                <span className="font-bold text-brand">{totalCards}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Đang xem</span>
                <span className="font-bold">{safeIndex + 1}</span>
              </div>
              {data.isDemo && (
                <div className="mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
                  🔒 Demo — từ đầu tiên
                </div>
              )}
            </div>
            {/* Units list */}
            <div className="mt-2">
              <div className="text-xs font-semibold text-muted-foreground mb-2">Các unit</div>
              {data.units.map((u, i) => (
                <div key={i} className="text-xs py-1 border-b border-[#f0e0e7] last:border-0">
                  <div className="font-semibold text-[#1a1a2e]">{u.label ?? `Unit ${i + 1}`}</div>
                  <div className="text-muted-foreground">{u.vocabulary?.length ?? 0} từ</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile bottom nav */}
      <div className="lg:hidden sticky bottom-0 bg-white border-t-2 border-[#f0e0e7] px-4 py-2 flex items-center justify-between z-10">
        <Button variant="brand" size="sm" onClick={() => goTo(safeIndex - 1)} disabled={safeIndex === 0} className="rounded-full disabled:opacity-40">
          <ChevronLeft className="w-4 h-4" /> Trước
        </Button>
        <span className="text-sm font-semibold">{safeIndex + 1} / {totalCards}</span>
        <Button variant="brand" size="sm" onClick={() => goTo(safeIndex + 1)} disabled={safeIndex >= totalCards - 1} className="rounded-full disabled:opacity-40">
          Tiếp <ChevronLeft className="w-4 h-4 rotate-180" />
        </Button>
      </div>
    </div>
  );
}
