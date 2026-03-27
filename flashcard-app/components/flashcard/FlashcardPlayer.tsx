"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { FlashcardContent, FlashcardVocab } from "@/types";
import { cn, cefrColor } from "@/lib/utils";
import { useUIStore } from "@/features/auth/store";
import { ChevronLeft, ChevronRight, Volume2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FlashcardPlayerProps {
  units: FlashcardContent[];
  isLimited?: boolean;
}

// ── Audio helpers (mirrors flashcard-mau.html logic) ──────────────────────

async function fetchFreeDictAudio(word: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.split("/")[0].trim())}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    for (const entry of data) {
      for (const ph of entry.phonetics ?? []) {
        if (ph.audio?.includes("us")) return ph.audio;
      }
      for (const ph of entry.phonetics ?? []) {
        if (ph.audio?.trim()) return ph.audio;
      }
    }
  } catch {}
  return null;
}

function browserTTS(word: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(word);
  u.lang = "en-US";
  u.rate = 0.85;
  window.speechSynthesis.speak(u);
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then((v) => { clearTimeout(t); resolve(v); }).catch((e) => { clearTimeout(t); reject(e); });
  });
}

// ── Component ──────────────────────────────────────────────────────────────

export function FlashcardPlayer({ units, isLimited = false }: FlashcardPlayerProps) {
  const { mode } = useUIStore();
  const isKid = mode === "kid";

  const [activeUnit, setActiveUnit] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioTokenRef = useRef(0);

  const currentVocab: FlashcardVocab[] = units[activeUnit]?.vocabulary ?? [];
  const currentWord = currentVocab[cardIndex];

  // Auto-speak on card change
  useEffect(() => {
    if (!currentWord) return;
    const timer = setTimeout(() => speakWord(), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardIndex, activeUnit]);

  const speakWord = useCallback(async () => {
    if (!currentWord) return;
    const rawWord = currentWord.word.split("/")[0].replace(/[()]/g, "").trim();

    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    window.speechSynthesis?.cancel();

    setAudioLoading(true);
    const token = ++audioTokenRef.current;

    try {
      const apiUrl = await withTimeout(fetchFreeDictAudio(rawWord), 5000);
      if (token !== audioTokenRef.current) return;

      if (apiUrl) {
        playUrl(apiUrl, rawWord, token);
        return;
      }
      throw new Error("no_mp3");
    } catch {
      if (token !== audioTokenRef.current) return;
      setAudioLoading(false);
      browserTTS(rawWord);
    }
  }, [currentWord]);

  function playUrl(url: string, rawWord: string, token: number) {
    const a = new Audio(url);
    audioRef.current = a;

    const fallback = setTimeout(() => {
      if (token !== audioTokenRef.current) return;
      a.pause();
      audioRef.current = null;
      setAudioLoading(false);
      browserTTS(rawWord);
    }, 5000);

    a.oncanplaythrough = () => {
      if (token !== audioTokenRef.current) { clearTimeout(fallback); a.pause(); return; }
      clearTimeout(fallback);
      setAudioLoading(false);
      a.play().catch(() => { if (token !== audioTokenRef.current) return; browserTTS(rawWord); });
    };

    a.onerror = () => {
      clearTimeout(fallback);
      if (token !== audioTokenRef.current) return;
      setAudioLoading(false);
      browserTTS(rawWord);
    };

    a.load();
  }

  function goNext() {
    setFlipped(false);
    setTimeout(() => setCardIndex((i) => (i + 1) % currentVocab.length), 50);
  }

  function goPrev() {
    setFlipped(false);
    setTimeout(() => setCardIndex((i) => (i - 1 + currentVocab.length) % currentVocab.length), 50);
  }

  function switchUnit(idx: number) {
    setActiveUnit(idx);
    setCardIndex(0);
    setFlipped(false);
  }

  function jumpTo(n: number) {
    if (n >= 1 && n <= currentVocab.length) {
      setFlipped(false);
      setTimeout(() => setCardIndex(n - 1), 50);
    }
  }

  if (!currentWord) return <div className="text-center py-20 text-muted-foreground">Không có từ vựng</div>;

  const synonyms = Array.isArray(currentWord.synonyms) ? currentWord.synonyms.join(", ") : currentWord.synonyms ?? "";
  const antonyms = Array.isArray(currentWord.antonyms) ? currentWord.antonyms.join(", ") : currentWord.antonyms ?? "";

  return (
    <div className={cn("flex flex-1 min-h-0 overflow-hidden", isKid && "kid-mode")}>
      {/* ── Left Sidebar: Units ── */}
      <nav
        className={cn(
          "bg-white border-r-2 border-border flex flex-col flex-shrink-0 transition-all duration-300 overflow-hidden",
          leftCollapsed ? "w-[52px]" : "w-[220px]",
          "sticky top-0 h-full"
        )}
      >
        <div className="flex items-center justify-between p-3 border-b-2 border-border flex-shrink-0">
          {!leftCollapsed && <span className="text-brand-red font-bold text-sm truncate">📚 Danh sách Unit</span>}
          <button
            onClick={() => setLeftCollapsed(!leftCollapsed)}
            className="p-1 rounded-lg hover:bg-brand-red-light text-brand-red flex-shrink-0 ml-auto"
          >
            {leftCollapsed ? "▶" : "◀"}
          </button>
        </div>
        <div className="overflow-y-auto flex-1 py-2">
          {units.map((unit, i) => (
            <button
              key={unit.id ?? i}
              onClick={() => switchUnit(i)}
              title={unit.label}
              className={cn(
                "flex items-center gap-2 w-full text-left px-3 py-2.5 text-sm font-semibold transition-all border-l-[3px]",
                i === activeUnit
                  ? "bg-brand-red-light text-brand-red border-brand-red"
                  : "text-gray-600 hover:bg-pink-50 hover:text-brand-red border-transparent"
              )}
            >
              <span className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                i === activeUnit ? "bg-brand-red text-white" : "bg-gray-100 text-gray-500"
              )}>
                {i + 1}
              </span>
              {!leftCollapsed && <span className="truncate">{unit.label}</span>}
            </button>
          ))}
        </div>
      </nav>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="flex-1 flex flex-col items-center py-8 px-4">
          <h1 className={cn("font-extrabold text-brand-red mb-1 text-center", isKid ? "text-4xl" : "text-3xl")}>
            {units[activeUnit]?.label}
          </h1>
          <p className="text-muted-foreground text-sm mb-6 italic text-center">
            {units[activeUnit]?.desc}
          </p>

          {isLimited && (
            <div className="mb-4 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700 text-sm font-medium">
              ⚠️ Chế độ xem thử — chỉ hiển thị 10 thẻ đầu. Liên hệ để mở khoá toàn bộ.
            </div>
          )}

          {/* Card */}
          <div className="w-full max-w-2xl">
            <div className="card-scene w-full" style={{ height: isKid ? "520px" : "460px" }}>
              <div
                className={cn("card-inner w-full h-full cursor-pointer", flipped && "flipped")}
                onClick={() => setFlipped(!flipped)}
              >
                {/* Front */}
                <div className={cn(
                  "card-face bg-white border-2 border-border rounded-[20px] shadow-md flex flex-col items-center justify-center gap-2 p-8",
                  isKid && "rounded-[2rem]"
                )}>
                  <div className={cn("font-extrabold text-brand-red text-center flashcard-word", isKid ? "text-5xl" : "text-4xl")}>
                    {currentWord.word}
                  </div>
                  <div className="text-muted-foreground text-lg">{currentWord.phonetic}</div>
                  {currentWord.cefr && (
                    <span className={cn("text-xs font-bold px-3 py-1 rounded-full", cefrColor(currentWord.cefr))}>
                      {currentWord.cefr}
                    </span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); speakWord(); }}
                    className="text-3xl p-2 hover:scale-110 transition-transform"
                    disabled={audioLoading}
                  >
                    {audioLoading ? <Loader2 className="h-7 w-7 animate-spin text-brand-red" /> : "🔊"}
                  </button>
                  <span className="text-muted-foreground text-sm italic">Nhấn để xem nghĩa</span>
                </div>

                {/* Back */}
                <div className={cn(
                  "card-face card-back-face bg-brand-red text-white rounded-[20px] shadow-md flex flex-col items-center justify-center gap-3 p-8 overflow-y-auto",
                  isKid && "rounded-[2rem]"
                )}>
                  <div className={cn("font-extrabold text-center flashcard-meaning", isKid ? "text-3xl" : "text-2xl")}>
                    {currentWord.meaning}
                  </div>
                  <span className="bg-white/25 text-white text-sm px-4 py-1 rounded-full font-semibold">
                    {currentWord.type}
                  </span>
                  <div className="w-12 h-0.5 bg-white/40 rounded-full" />
                  {currentWord.example && (
                    <div className="text-sm text-center max-w-[90%] leading-relaxed">
                      <span className="bg-white/20 font-bold px-2 py-0.5 rounded-lg text-xs mr-1">Ví dụ</span>
                      {currentWord.example}
                    </div>
                  )}
                  {currentWord.translation && (
                    <div className="text-sm text-center max-w-[90%] leading-relaxed italic opacity-90">
                      <span className="bg-white/20 font-bold px-2 py-0.5 rounded-lg text-xs mr-1 not-italic">Dịch</span>
                      {currentWord.translation}
                    </div>
                  )}
                  <div className="w-12 h-0.5 bg-white/40 rounded-full" />
                  {synonyms && (
                    <div className="text-sm text-center max-w-[90%]">
                      <span className="bg-white/20 font-bold px-2 py-0.5 rounded-lg text-xs mr-1">Đồng nghĩa</span>
                      {synonyms}
                    </div>
                  )}
                  {antonyms && (
                    <div className="text-sm text-center max-w-[90%]">
                      <span className="bg-white/20 font-bold px-2 py-0.5 rounded-lg text-xs mr-1">Trái nghĩa</span>
                      {antonyms}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4 mt-5">
              <Button onClick={goPrev} variant="default" size="lg">
                <ChevronLeft className="mr-1 h-5 w-5" /> Trước
              </Button>
              <Button onClick={goNext} variant="default" size="lg">
                Tiếp <ChevronRight className="ml-1 h-5 w-5" />
              </Button>
            </div>

            <div className="text-center mt-4 font-semibold text-gray-600">
              Thẻ {cardIndex + 1} / {currentVocab.length}
            </div>

            {/* Jump to card */}
            <div className="flex items-center justify-center gap-3 mt-3 flex-wrap">
              <label className="text-sm font-semibold text-gray-600">Đi đến thẻ:</label>
              <input
                type="number"
                min={1}
                max={currentVocab.length}
                placeholder="..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    jumpTo(parseInt((e.target as HTMLInputElement).value));
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
                className="w-20 text-center border-2 border-brand-red rounded-xl px-2 py-1.5 text-sm font-bold text-brand-red outline-none"
              />
              <button
                onClick={(e) => {
                  const inp = (e.currentTarget.previousElementSibling as HTMLInputElement);
                  jumpTo(parseInt(inp.value));
                  inp.value = "";
                }}
                className="bg-brand-red text-white px-4 py-1.5 rounded-full text-sm font-bold hover:bg-brand-red-dark"
              >
                Đi
              </button>
            </div>
            <p className="text-center text-muted-foreground text-xs mt-2">💡 Nhấn vào thẻ để lật</p>
          </div>
        </div>
      </div>

      {/* ── Right Sidebar: Word List ── */}
      <aside
        className={cn(
          "bg-white border-l-2 border-border flex flex-col flex-shrink-0 transition-all duration-300 overflow-hidden",
          rightCollapsed ? "w-[40px]" : "w-[260px]",
          "sticky top-0 h-full"
        )}
      >
        <div className="flex items-center gap-2 p-3 border-b-2 border-border flex-shrink-0">
          <button
            onClick={() => setRightCollapsed(!rightCollapsed)}
            className="p-1 rounded-lg hover:bg-brand-red-light text-brand-red flex-shrink-0"
          >
            {rightCollapsed ? "◀" : "▶"}
          </button>
          {!rightCollapsed && <span className="text-brand-red font-bold text-sm truncate">📋 Danh sách từ</span>}
        </div>
        {!rightCollapsed && (
          <div className="overflow-y-auto flex-1 p-2">
            {currentVocab.map((v, i) => (
              <button
                key={i}
                onClick={() => { setFlipped(false); setTimeout(() => setCardIndex(i), 50); }}
                className={cn(
                  "w-full flex items-center gap-2 p-2.5 rounded-xl mb-1.5 border-2 transition-all text-left",
                  i === cardIndex
                    ? "bg-brand-red text-white border-brand-red"
                    : "bg-gray-50 border-transparent hover:bg-pink-50 hover:border-brand-red hover:translate-x-[-3px]"
                )}
              >
                <span className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                  i === cardIndex ? "bg-white text-brand-red" : "bg-brand-red text-white"
                )}>
                  {i + 1}
                </span>
                <span className="font-semibold text-sm flex-1 truncate">{v.word}</span>
                {v.cefr && (
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0",
                    i === cardIndex ? "bg-white/25 text-white" : cefrColor(v.cefr)
                  )}>
                    {v.cefr}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
