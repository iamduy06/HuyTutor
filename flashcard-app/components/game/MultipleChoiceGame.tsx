"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Check, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameResult } from "@/components/game/GameResult";
import { GameShell } from "@/components/game/GameShell";
import { useGameStore } from "@/features/game/store";
import { useGameVocab } from "@/features/game/useGameVocab";
import { shuffle, buildChoices, type Choice } from "@/features/game/gameUtils";
import type { VocabItem } from "@/types";

interface DeckOption { deck_id: string; title: string; wordCount?: number; }

function MultipleChoiceInner({ vocab }: { vocab: VocabItem[] }) {
  const {
    questions, currentIndex, isFinished, score, answers,
    startGame, submitAnswer, nextQuestion, resetGame,
    isStarted, questionCount, setQuestionCount,
  } = useGameStore();

  const [choices, setChoices]       = useState<Choice[]>([]);
  const [selected, setSelected]     = useState<number | null>(null);
  const [submitted, setSubmitted]   = useState(false);

  const currentVocab = questions[currentIndex];

  // Build choices khi câu thay đổi
  useEffect(() => {
    if (!currentVocab) return;
    setChoices(buildChoices(currentVocab, vocab));
    setSelected(null);
    setSubmitted(false);
  }, [currentIndex, currentVocab, vocab]);

  function handleStart() {
    startGame(shuffle(vocab).slice(0, Math.min(questionCount, vocab.length)));
  }

  function handleSelect(idx: number) {
    if (submitted) return;
    setSelected(idx);
    setSubmitted(true);
    const isCorrect = choices[idx].isCorrect;
    submitAnswer(currentIndex, choices[idx].text, isCorrect);
    // Không tự chuyển — người dùng bấm Next
  }

  function handleNext() { nextQuestion(); }

  if (isFinished) {
    return (
      <GameResult
        score={score} total={questions.length} answers={answers} questions={questions}
        onReplay={() => { resetGame(); handleStart(); }}
      />
    );
  }

  if (!isStarted) {
    return (
      <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-8 flex flex-col gap-5 items-center text-center">
        <div className="text-5xl">📝</div>
        <h2 className="font-extrabold text-[#1a1a2e] text-xl">Chọn Nghĩa Đúng</h2>
        <p className="text-muted-foreground text-sm max-w-sm">
          Xem từ tiếng Anh, chọn 1 trong 4 nghĩa đúng nhất.
        </p>
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-muted-foreground">Số câu hỏi:</label>
          <input
            type="number" min={4} max={Math.min(30, vocab.length)}
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

  return (
    <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-6 flex flex-col gap-6">
      {/* Word display */}
      <div className="text-center flex flex-col gap-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Từ tiếng Anh</span>
        <div className="text-4xl font-extrabold text-brand">{currentVocab.word}</div>
        {currentVocab.phonetic && (
          <div className="text-muted-foreground">{currentVocab.phonetic}</div>
        )}
      </div>

      {/* Choices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {choices.map((choice, i) => {
          const isSelected = selected === i;
          const showResult = submitted;
          const correct = choice.isCorrect;

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={submitted}
              className={cn(
                "relative px-4 py-4 rounded-xl border-2 font-semibold text-sm text-left",
                "transition-all duration-200",
                !submitted && "hover:border-brand hover:bg-brand-light cursor-pointer",
                submitted && correct && "border-green-400 bg-green-50 text-green-800",
                submitted && !correct && isSelected && "border-red-400 bg-red-50 text-red-800",
                submitted && !correct && !isSelected && "border-[#f0e0e7] opacity-60 cursor-not-allowed",
                !submitted && "border-[#f0e0e7] bg-white text-[#1a1a2e]"
              )}
            >
              <span className="w-6 h-6 rounded-full bg-[#f0e0e7] text-brand font-bold text-xs
                             inline-flex items-center justify-center mr-2 flex-shrink-0">
                {String.fromCharCode(65 + i)}
              </span>
              {choice.text}
              {showResult && correct && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />
              )}
              {showResult && !correct && isSelected && (
                <X className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-600" />
              )}
            </button>
          );
        })}
      </div>

      {/* Next button — hiện sau khi đã chọn */}
      {submitted && (
        <div className="flex justify-end">
          <Button variant="brand" className="gap-2" onClick={handleNext}>
            Tiếp theo <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export function MultipleChoiceGame({ userDecks }: { userDecks: DeckOption[] }) {
  const { selectedDeckId } = useGameStore();
  const { data } = useGameVocab(selectedDeckId === undefined ? null : selectedDeckId);

  return (
    <GameShell
      title="Chọn Nghĩa Đúng" icon="📝" minWords={4}
      minWordsMessage="Cần ít nhất 4 từ để tạo đủ đáp án nhiễu."
      userDecks={userDecks}
    >
      {data && <MultipleChoiceInner vocab={data.vocab} />}
    </GameShell>
  );
}
