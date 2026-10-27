"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, Volume2, Eye, EyeOff, Check, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameResult } from "@/components/game/GameResult";
import { GameShell } from "@/components/game/GameShell";
import { useGameStore } from "@/features/game/store";
import { useGameVocab } from "@/features/game/useGameVocab";
import {
  shuffle,
  checkListeningAnswer,
  normalizeWordForAudio,
} from "@/features/game/gameUtils";
import { smartPlayWord, preloadAudioBatch } from "@/lib/audio";
import type { VocabItem } from "@/types";

interface DeckOption { deck_id: string; title: string; wordCount?: number; }
interface ListeningGameProps { userDecks: DeckOption[]; }

// ── Inner game (khi đã có vocab) ──────────────────────────────────────────────
function ListeningInner({ vocab, allVocab }: { vocab: VocabItem[]; allVocab: VocabItem[] }) {
  const {
    questions, currentIndex, isFinished, score, answers,
    startGame, submitAnswer, nextQuestion, resetGame, questionCount, setQuestionCount,
  } = useGameStore();

  const [showMeaning, setShowMeaning] = useState(false);
  const [inputValue, setInputValue]   = useState("");
  const [submitted, setSubmitted]     = useState(false);
  const [isCorrect, setIsCorrect]     = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);

  const audioRef   = useRef<HTMLAudioElement | null>(null);
  const tokenRef   = useRef(0);
  const cacheRef   = useRef<Map<string, string>>(new Map());
  const inputRef   = useRef<HTMLInputElement>(null);
  const isStarted  = useGameStore(s => s.isStarted);

  const currentVocab = questions[currentIndex];

  // ── Phát âm tức thì không độ trễ ──
  const speakWord = useCallback((word: string) => {
    smartPlayWord(
      word,
      audioRef,
      tokenRef,
      () => setAudioLoading(true),
      () => setAudioLoading(false)
    );
  }, []);

  // Auto-play khi đổi câu + preload trước các câu tiếp theo
  useEffect(() => {
    if (!currentVocab) return;
    setInputValue(""); setSubmitted(false); setIsCorrect(false); setShowMeaning(false);
    const t = setTimeout(() => speakWord(currentVocab.word), 150);
    inputRef.current?.focus();

    // Preload trước 5 câu tiếp theo
    if (questions.length > 0) {
      const nextWords = questions.slice(currentIndex + 1, currentIndex + 6).map(q => q.word);
      preloadAudioBatch(nextWords);
    }

    return () => clearTimeout(t);
  }, [currentIndex, currentVocab, questions, speakWord]);

  // ── Handlers ──
  function handleStart() {
    const q = shuffle(vocab).slice(0, questionCount);
    startGame(q);
  }

  function handleSubmit() {
    if (!currentVocab || submitted) return;
    const correct = checkListeningAnswer(inputValue, currentVocab.word);
    setIsCorrect(correct);
    setSubmitted(true);
    submitAnswer(currentIndex, inputValue, correct);
    if (correct) {
      setTimeout(() => nextQuestion(), 1200);
    }
  }

  function handleNext() { nextQuestion(); }

  if (isFinished) {
    return (
      <GameResult
        score={score}
        total={questions.length}
        answers={answers}
        questions={questions}
        onReplay={() => { resetGame(); handleStart(); }}
      />
    );
  }

  // ── Setup screen ──
  if (!isStarted) {
    return (
      <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-8 flex flex-col gap-5 items-center text-center">
        <div className="text-5xl">🎧</div>
        <h2 className="font-extrabold text-[#1a1a2e] text-xl">Nghe & Viết</h2>
        <p className="text-muted-foreground text-sm max-w-sm">
          Nghe phát âm từ tiếng Anh và gõ lại từ đó. Có thể bật/tắt gợi ý nghĩa tiếng Việt.
        </p>
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-muted-foreground">Số câu hỏi:</label>
          <input
            type="number" min={5} max={Math.min(30, vocab.length)}
            value={questionCount}
            onChange={e => setQuestionCount(Number(e.target.value))}
            className="w-20 text-center border-2 border-[#f0e0e7] rounded-xl px-3 py-2 font-bold text-brand focus:border-brand outline-none"
          />
          <span className="text-xs text-muted-foreground">(tối đa {Math.min(30, vocab.length)})</span>
        </div>
        <Button variant="brand" size="lg" onClick={handleStart} className="gap-2 mt-2">
          🎮 Bắt đầu
        </Button>
      </div>
    );
  }

  if (!currentVocab) return null;

  const borderColor = submitted
    ? isCorrect ? "border-green-400" : "border-red-400"
    : "border-[#f0e0e7]";

  return (
    <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-6 flex flex-col gap-5">
      {/* Audio */}
      <div className="flex flex-col items-center gap-4 py-4">
        <button
          onClick={() => speakWord(currentVocab.word)}
          className="w-24 h-24 rounded-full bg-brand text-white flex items-center justify-center shadow-lg hover:bg-[#c0003a] transition-all hover:scale-105 active:scale-95"
          title="Phát lại"
        >
          {audioLoading
            ? <Loader2 className="w-10 h-10 animate-spin" />
            : <Volume2 className="w-10 h-10" />}
        </button>
        <p className="text-sm text-muted-foreground">Nhấn để nghe lại</p>
      </div>

      {/* Toggle meaning */}
      <button
        onClick={() => setShowMeaning(v => !v)}
        className="flex items-center gap-2 text-sm font-semibold text-brand hover:underline self-center"
      >
        {showMeaning ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        {showMeaning ? "Ẩn nghĩa" : "Hiện nghĩa"}
      </button>

      {showMeaning && (
        <div className="bg-brand-light border border-brand/20 rounded-xl px-4 py-2.5 text-center font-semibold text-brand text-sm">
          {currentVocab.meaning}
        </div>
      )}

      {/* Input */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-muted-foreground">Gõ từ tiếng Anh:</label>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !submitted) handleSubmit(); }}
          disabled={submitted}
          placeholder="Nhập từ bạn nghe được…"
          className={`border-2 ${borderColor} rounded-xl px-4 py-3 font-bold text-[#1a1a2e] text-lg
                      outline-none focus:ring-2 focus:ring-brand/20 transition-all
                      disabled:bg-gray-50`}
        />
        {/* Feedback */}
        {submitted && (
          <div className={`flex items-center gap-2 font-semibold text-sm ${isCorrect ? "text-green-600" : "text-red-600"}`}>
            {isCorrect
              ? <><Check className="w-4 h-4" /> Chính xác!</>
              : <><X className="w-4 h-4" /> Sai rồi. Đáp án đúng: <strong>{currentVocab.word}</strong></>}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        {!submitted ? (
          <Button variant="brand" className="flex-1 gap-2" onClick={handleSubmit}>
            <Check className="w-4 h-4" /> Kiểm tra
          </Button>
        ) : (
          <Button variant="brand" className="flex-1 gap-2" onClick={handleNext}>
            Tiếp theo <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Phonetic hint */}
      {submitted && currentVocab.phonetic && (
        <p className="text-center text-sm text-muted-foreground italic">{currentVocab.phonetic}</p>
      )}
    </div>
  );
}

// ── Wrapper ───────────────────────────────────────────────────────────────────
export function ListeningGame({ userDecks }: ListeningGameProps) {
  const { selectedDeckId, selectedTabIds, questionCount, startGame, resetGame } = useGameStore();
  const { data } = useGameVocab(selectedDeckId === undefined ? null : selectedDeckId, undefined, selectedTabIds);

  const handleReplay = () => {
    if (!data?.vocab) return;
    resetGame();
    const q = shuffle(data.vocab).slice(0, questionCount);
    startGame(q);
  };

  return (
    <GameShell
      title="Nghe & Viết"
      icon="🎧"
      minWords={3}
      minWordsMessage="Cần ít nhất 3 từ để chơi chế độ này."
      userDecks={userDecks}
      onReplay={handleReplay}
    >
      {data && (
        <ListeningInner vocab={data.vocab} allVocab={data.vocab} />
      )}
    </GameShell>
  );
}
