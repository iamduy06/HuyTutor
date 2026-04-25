"use client";

import Link from "next/link";
import { Trophy, RotateCcw, ArrowLeft, XCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VocabItem } from "@/types";

interface AnswerRecord {
  userAnswer: string;
  isCorrect: boolean;
}

interface GameResultProps {
  score: number;
  total: number;
  answers: Record<number, AnswerRecord>;
  questions: VocabItem[];
  onReplay: () => void;
  backHref?: string;
}

export function GameResult({
  score,
  total,
  answers,
  questions,
  onReplay,
  backHref = "/dashboard",
}: GameResultProps) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const wrongItems = Object.entries(answers)
    .filter(([, a]) => !a.isCorrect)
    .map(([idx, a]) => ({ vocab: questions[Number(idx)], userAnswer: a.userAnswer }))
    .filter(item => item.vocab);

  const emoji = pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "💪";
  const msg =
    pct >= 80 ? "Xuất sắc! Bạn đã làm rất tốt!" :
    pct >= 50 ? "Khá tốt! Tiếp tục luyện tập nhé." :
    "Đừng nản lòng! Thử lại để cải thiện.";

  return (
    <div className="max-w-xl mx-auto py-10 px-4 flex flex-col gap-6">
      {/* Score card */}
      <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-8 flex flex-col items-center gap-4 text-center shadow-sm">
        <div className="text-5xl">{emoji}</div>
        <div className="flex items-center gap-2 text-brand">
          <Trophy className="w-6 h-6" />
          <span className="font-extrabold text-2xl">{score} / {total}</span>
        </div>
        <p className="text-muted-foreground font-medium">{msg}</p>

        {/* Score bar */}
        <div className="w-full h-3 bg-[#f0e0e7] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: pct >= 80 ? "#16a34a" : pct >= 50 ? "#ea580c" : "#dc2626",
            }}
          />
        </div>
        <p className="text-sm font-bold text-muted-foreground">{pct}% chính xác</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-center flex-wrap">
        <Button onClick={onReplay} variant="brand" className="gap-2">
          <RotateCcw className="w-4 h-4" /> Chơi lại
        </Button>
        <Button asChild variant="brand-outline" className="gap-2">
          <Link href={backHref}>
            <ArrowLeft className="w-4 h-4" /> Về Dashboard
          </Link>
        </Button>
      </div>

      {/* Wrong answers review */}
      {wrongItems.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-5">
          <h3 className="font-extrabold text-[#1a1a2e] mb-3 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            Câu sai ({wrongItems.length})
          </h3>
          <div className="flex flex-col gap-2">
            {wrongItems.map(({ vocab, userAnswer }, i) => (
              <div key={i} className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm">
                <div className="font-bold text-[#1a1a2e]">{vocab.word}</div>
                <div className="flex gap-4 mt-1">
                  <span className="text-red-600 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" />
                    {userAnswer || "(bỏ trống)"}
                  </span>
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {vocab.meaning}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
