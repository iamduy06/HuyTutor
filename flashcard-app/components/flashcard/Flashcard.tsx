"use client";

import { Volume2, Loader2, RotateCcw } from "lucide-react";
import { cn, getCefrColor, toArray } from "@/lib/utils";
import type { FlashcardContent } from "@/types";
import { useLearningStore } from "@/features/learning/store";
import { useSpeech } from "@/hooks/useSpeech";

interface FlashcardProps {
  content: FlashcardContent;
  isKid?: boolean;
}

export function Flashcard({ content, isKid = false }: FlashcardProps) {
  const { isFlipped, toggleFlipped } = useLearningStore();
  const { speak, isSpeaking } = useSpeech();

  const synonyms = toArray(content.synonyms);
  const antonyms = toArray(content.antonyms);

  function handleSpeakWord(e: React.MouseEvent) {
    e.stopPropagation();
    speak(content.word);
  }

  function handleSpeakExample(e: React.MouseEvent) {
    e.stopPropagation();
    if (content.example) speak(content.example);
  }

  return (
    <div
      className={cn(
        "card-scene w-full cursor-pointer select-none",
        isKid ? "h-[500px]" : "h-[460px]"
      )}
      onClick={toggleFlipped}
      role="button"
      tabIndex={0}
      aria-label={isFlipped ? "Nhấn để xem mặt trước" : "Nhấn để xem nghĩa"}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleFlipped();
        }
      }}
    >
      <div className={cn("card-inner w-full h-full", isFlipped && "flipped")}>

        {/* ── FRONT ── */}
        <div
          className={cn(
            "card-face flex flex-col items-center justify-center p-8 gap-3",
            "bg-white border-2 border-[#e9ecef]",
            "shadow-[0_5px_20px_rgba(0,0,0,0.1)]",
            isKid ? "rounded-3xl" : "rounded-[20px]"
          )}
        >
          {content.cefr && (
            <span
              className={cn(
                "text-xs font-bold px-3 py-1 rounded-full",
                getCefrColor(content.cefr)
              )}
            >
              {content.cefr}
            </span>
          )}

          <div
            className={cn(
              "font-extrabold text-brand text-center leading-tight",
              isKid ? "text-6xl" : "text-5xl"
            )}
          >
            {content.word}
          </div>

          {content.phonetic && (
            <div className="text-muted-foreground text-xl text-center">
              {content.phonetic}
            </div>
          )}

          <button
            onClick={handleSpeakWord}
            aria-label="Phát âm từ vựng"
            className="text-4xl p-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-brand/40 rounded-full"
          >
            {isSpeaking ? (
              <Loader2 className="w-8 h-8 animate-spin text-brand" />
            ) : (
              "🔊"
            )}
          </button>

          <div className="text-muted-foreground text-sm italic mt-1">
            Nhấn để xem nghĩa
          </div>
        </div>

        {/* ── BACK ── */}
        <div
          className={cn(
            "card-face card-back flex flex-col items-center justify-center p-8 gap-3 overflow-y-auto",
            "bg-brand text-white",
            "shadow-[0_5px_20px_rgba(0,0,0,0.1)]",
            isKid ? "rounded-3xl" : "rounded-[20px]"
          )}
        >
          <div
            className={cn(
              "font-extrabold text-center leading-tight",
              isKid ? "text-4xl" : "text-3xl"
            )}
          >
            {content.meaning}
          </div>

          {content.type && (
            <div className="text-sm bg-white/25 px-4 py-1 rounded-full font-semibold">
              {content.type}
            </div>
          )}

          <div className="w-12 h-0.5 bg-white/40 rounded" />

          {content.example && (
            <div className="flex items-start gap-2 max-w-[90%] text-sm leading-relaxed">
              <div className="flex-1">
                <span className="font-bold bg-white/20 px-2 py-0.5 rounded-lg mr-1.5 text-xs">
                  Ví dụ
                </span>
                {content.example}
              </div>
              <button
                onClick={handleSpeakExample}
                aria-label="Phát âm ví dụ"
                className="flex-shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors focus:outline-none"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {content.translation && (
            <div className="max-w-[90%] text-sm leading-relaxed opacity-90 text-center italic">
              <span className="font-bold bg-white/20 px-2 py-0.5 rounded-lg mr-1.5 text-xs not-italic">
                Dịch
              </span>
              {content.translation}
            </div>
          )}

          {(synonyms.length > 0 || antonyms.length > 0) && (
            <div className="w-12 h-0.5 bg-white/40 rounded" />
          )}

          {synonyms.length > 0 && (
            <div className="max-w-[90%] text-sm text-center">
              <span className="font-bold bg-white/20 px-2 py-0.5 rounded-lg mr-1.5 text-xs">
                Đồng nghĩa
              </span>
              {synonyms.join(", ")}
            </div>
          )}

          {antonyms.length > 0 && (
            <div className="max-w-[90%] text-sm text-center">
              <span className="font-bold bg-white/20 px-2 py-0.5 rounded-lg mr-1.5 text-xs">
                Trái nghĩa
              </span>
              {antonyms.join(", ")}
            </div>
          )}

          <div className="mt-2 flex items-center gap-1 opacity-60 text-xs">
            <RotateCcw className="w-3 h-3" />
            Nhấn để lật lại
          </div>
        </div>
      </div>
    </div>
  );
}
