"use client";

import { ReactNode, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeckSelector } from "@/components/game/DeckSelector";
import { TabSelector } from "@/components/game/TabSelector";
import { ProgressBar } from "@/components/game/ProgressBar";
import { useGameStore } from "@/features/game/store";
import { useGameVocab } from "@/features/game/useGameVocab";
import { shuffle } from "@/features/game/gameUtils";

interface DeckOption {
  deck_id: string;
  title: string;
  wordCount?: number;
  tabs?: { id: string; label: string; wordCount: number }[];
}

interface GameShellProps {
  title: string;
  icon: string;
  minWords: number;
  minWordsMessage?: string;
  children: ReactNode;
  userDecks: DeckOption[];
  vocabLimit?: number;
  onVocabReady?: (vocab: import("@/types").VocabItem[]) => void;
  showProgress?: boolean; // default true
  onReplay?: () => void;
}

export function GameShell({
  title, icon, minWords, minWordsMessage,
  children, userDecks, vocabLimit, onVocabReady,
  showProgress = true,
  onReplay
}: GameShellProps) {
  const { selectedDeckId, selectedTabIds, setSelectedTabIds, setDeck, currentIndex, questions, isStarted, isFinished, resetGame } = useGameStore();
  const { data, isLoading, isFetching, error, refetch } = useGameVocab(
    selectedDeckId === undefined ? null : selectedDeckId,
    vocabLimit,
    selectedTabIds
  );

  // Reset session when entering or leaving the game page
  useEffect(() => {
    resetGame();
    return () => resetGame();
  }, [resetGame]);

  // Expose refetch so parent can re-trigger after deck change
  const handleDeckChange = (id: string | null) => {
    setDeck(id);
  };

  const hasEnoughWords = (data?.vocab.length ?? 0) >= minWords;
  const currentDeck = userDecks.find(d => d.deck_id === selectedDeckId);
  const availableTabs = currentDeck?.tabs ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button asChild variant="brand-outline" size="sm" className="gap-1.5">
          <Link href="/dashboard">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
        </Button>
        <h1 className="font-extrabold text-[#1a1a2e] text-xl flex items-center gap-2">
          <span className="text-2xl">{icon}</span> {title}
        </h1>

        {isStarted && !isFinished && onReplay && (
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" onClick={() => resetGame()} className="text-xs h-8">
              Chọn lại Decks/Tabs
            </Button>
            <Button size="sm" variant="brand" onClick={onReplay} className="text-xs h-8 gap-1">
              Chơi lại
            </Button>
          </div>
        )}
      </div>

      {/* Setup Area */}
      <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-4 flex flex-col gap-4">
        {/* Deck Selector */}
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm font-semibold text-muted-foreground">Chọn bộ deck:</span>
          <DeckSelector
            decks={userDecks}
            value={selectedDeckId ?? null}
            onChange={handleDeckChange}
            disabled={isLoading || isStarted}
          />
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            {isFetching && <Loader2 className="w-3.5 h-3.5 animate-spin text-brand" />}
            {data && (
              <span>
                {data.vocab.length} từ{vocabLimit ? ` (giới hạn ${vocabLimit})` : ""}
              </span>
            )}
          </div>
        </div>

        {/* Tab Selector */}
        {selectedDeckId && availableTabs.length > 0 && !isStarted && (
          <div className="pt-4 border-t-2 border-[#f0e0e7]/50 mt-2">
            <TabSelector
              tabs={availableTabs}
              selectedTabIds={selectedTabIds}
              onChange={setSelectedTabIds}
              disabled={isLoading || isStarted}
            />
          </div>
        )}
      </div>

      {/* Progress (chỉ hiện khi đang chơi và showProgress=true) */}
      {showProgress && isStarted && !isFinished && questions.length > 0 && (
        <ProgressBar current={currentIndex} total={questions.length} />
      )}

      {/* Content area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <Loader2 className="w-10 h-10 animate-spin text-brand" />
          <p>Đang tải từ vựng…</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <AlertCircle className="w-10 h-10 text-destructive" />
          <p className="font-medium text-muted-foreground">{error?.message || String(error)}</p>
          <Button variant="brand" onClick={() => refetch()}>Thử lại</Button>
        </div>
      ) : !hasEnoughWords ? (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-8 text-center flex flex-col gap-3">
          <div className="text-4xl">⚠️</div>
          <p className="font-bold text-amber-800">
            {minWordsMessage ?? `Cần ít nhất ${minWords} từ để chơi chế độ này.`}
          </p>
          <p className="text-sm text-amber-700">
            Hiện tại deck có {data?.vocab.length ?? 0} từ. Hãy chọn deck khác hoặc "Tất cả deck".
          </p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
