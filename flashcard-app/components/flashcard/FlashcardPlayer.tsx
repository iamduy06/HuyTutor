"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Volume2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, getCefrColor } from "@/lib/utils";
import type { Flashcard } from "@/types";
import { useUIStore } from "@/features/auth/store";

interface FlashcardPlayerProps {
  cards: Flashcard[];
  deckTitle: string;
  deckDesc?: string;
  isDemo?: boolean;
}

function slugify(w: string) {
  return w.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
}

async function fetchFreeDictAudio(word: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.split("/")[0].trim())}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    for (const entry of data) {
      for (const ph of entry.phonetics || []) {
        if (ph.audio && ph.audio.includes("us")) return ph.audio;
      }
      for (const ph of entry.phonetics || []) {
        if (ph.audio && ph.audio.trim()) return ph.audio;
      }
    }
  } catch {}
  return null;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then((v) => { clearTimeout(t); resolve(v); }).catch((e) => { clearTimeout(t); reject(e); });
  });
}

export function FlashcardPlayer({ cards, deckTitle, deckDesc, isDemo }: FlashcardPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [jumpValue, setJumpValue] = useState("");
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const { mode } = useUIStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioTokenRef = useRef(0);

  const card = cards[currentIndex];
  const content = card?.content;

  const speakWord = useCallback(async (word: string) => {
    if (!word) return;
    const rawWord = word.split("/")[0].replace(/[()]/g, "").trim();

    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();

    setAudioLoading(true);
    const token = ++audioTokenRef.current;

    const browserTTS = () => {
      if (token !== audioTokenRef.current) return;
      setAudioLoading(false);
      if (!window.speechSynthesis) return;
      const u = new SpeechSynthesisUtterance(rawWord);
      u.lang = "en-US"; u.rate = 0.85;
      window.speechSynthesis.speak(u);
    };

    try {
      const apiUrl = await withTimeout(fetchFreeDictAudio(rawWord), 5000);
      if (token !== audioTokenRef.current) return;

      let audioUrl = apiUrl;
      if (!audioUrl) {
        const slug = slugify(rawWord);
        const mwUrl = `https://media.merriam-webster.com/audio/prons/en/us/mp3/${slug[0]}/${slug}.mp3`;
        const works = await withTimeout(
          new Promise<boolean>((res) => {
            const a = new Audio();
            a.oncanplaythrough = () => res(true);
            a.onerror = () => res(false);
            a.src = mwUrl;
          }),
          5000
        );
        if (token !== audioTokenRef.current) return;
        if (works) audioUrl = mwUrl;
      }

      if (!audioUrl) throw new Error("no_audio");

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      const fallback = setTimeout(() => { if (token === audioTokenRef.current) browserTTS(); }, 5000);

      audio.oncanplaythrough = () => {
        if (token !== audioTokenRef.current) { clearTimeout(fallback); audio.pause(); return; }
        clearTimeout(fallback);
        setAudioLoading(false);
        audio.play().catch(() => { if (token === audioTokenRef.current) browserTTS(); });
      };
      audio.onerror = () => { clearTimeout(fallback); if (token === audioTokenRef.current) browserTTS(); };
      audio.load();
    } catch {
      if (token === audioTokenRef.current) browserTTS();
    }
  }, []);

  const goTo = useCallback((index: number) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex(index);
    }, 50);
  }, []);

  useEffect(() => {
    if (isFirstLoad) { setIsFirstLoad(false); return; }
    if (content?.word) {
      const t = setTimeout(() => speakWord(content.word), 400);
      return () => clearTimeout(t);
    }
  }, [currentIndex, content?.word, isFirstLoad, speakWord]);

  if (!card || !content) return <div className="p-8 text-center text-muted-foreground">Không có từ nào</div>;

  const isKid = mode === "kid";

  return (
    <div className={cn("flex flex-1 min-h-0", isKid && "kid-mode")}>
      {/* Left sidebar */}
      <nav
        className={cn(
          "bg-white border-r-2 border-[#f0e0e7] flex flex-col flex-shrink-0 shadow-[2px_0_12px_rgba(0,0,0,0.06)] sticky top-[62px] h-[calc(100vh-62px)] transition-all duration-300 overflow-hidden",
          leftCollapsed ? "w-[52px]" : "w-[230px]",
          "hidden md:flex"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b-2 border-[#f0e0e7] flex-shrink-0">
          {!leftCollapsed && <span className="text-brand font-extrabold text-[1.05em] whitespace-nowrap">📚 Danh sách Unit</span>}
          <button
            onClick={() => setLeftCollapsed(!leftCollapsed)}
            className="bg-none border-none cursor-pointer text-brand text-xl p-1 rounded-lg hover:bg-brand-light ml-auto"
          >
            {leftCollapsed ? "▶" : "◀"}
          </button>
        </div>
        <div className="overflow-y-auto flex-1 py-2">
          <button
            className={cn(
              "flex items-center gap-2.5 w-full bg-none border-none py-3 px-3.5 text-left cursor-pointer font-semibold text-sm text-[#495057] transition-all border-l-4 border-brand bg-brand-light text-brand whitespace-nowrap overflow-hidden"
            )}
          >
            <span className="bg-brand text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
            {!leftCollapsed && <span className="truncate">{deckTitle}</span>}
          </button>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="flex-1 p-7 flex flex-col items-center px-4 md:px-[5%]">
          <h1 className={cn(
            "font-extrabold mb-1.5 text-center text-brand",
            isKid ? "text-4xl" : "text-3xl"
          )}>
            {deckTitle}
          </h1>
          {deckDesc && <p className="text-muted-foreground text-sm mb-5 text-center italic">{deckDesc}</p>}
          {isDemo && (
            <div className="mb-4 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700 text-center">
              🎯 Đang xem <strong>demo</strong> — tối đa 10 từ. Đăng nhập để học đầy đủ.
            </div>
          )}

          <div className={cn("w-full", isKid ? "max-w-2xl" : "max-w-[860px]")}>
            {/* Card */}
            <div
              className={cn("card-scene mb-6 cursor-pointer", isKid ? "h-[500px]" : "h-[460px]")}
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div className={cn("card-inner w-full h-full", isFlipped && "flipped")}>
                {/* Front */}
                <div className={cn(
                  "card-face rounded-[20px] shadow-[0_5px_20px_rgba(0,0,0,0.1)] border-2 border-[#e9ecef] bg-white flex flex-col items-center justify-center p-8",
                  isKid && "rounded-3xl"
                )}>
                  <div className={cn(
                    "font-extrabold text-brand mb-1.5 text-center flashcard-word",
                    isKid ? "text-6xl" : "text-5xl"
                  )}>
                    {content.word}
                  </div>
                  <div className="text-muted-foreground text-xl mb-2">{content.phonetic}</div>
                  {content.cefr && (
                    <span className={cn("text-xs font-bold px-3 py-1 rounded-full mb-2", getCefrColor(content.cefr))}>
                      {content.cefr}
                    </span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); speakWord(content.word); }}
                    className="bg-none border-none text-4xl cursor-pointer p-2 transition-transform hover:scale-110 my-1"
                    disabled={audioLoading}
                  >
                    {audioLoading ? <Loader2 className="w-8 h-8 animate-spin text-brand" /> : "🔊"}
                  </button>
                  <div className="text-muted-foreground text-sm italic">Nhấn để xem nghĩa</div>
                </div>

                {/* Back */}
                <div className={cn(
                  "card-face card-back rounded-[20px] bg-brand text-white flex flex-col items-center justify-center p-8 overflow-y-auto",
                  isKid && "rounded-3xl"
                )}>
                  <div className="flex flex-col items-center gap-3 w-full text-center">
                    <div className={cn("font-extrabold leading-tight flashcard-meaning", isKid ? "text-4xl" : "text-3xl")}>
                      {content.meaning}
                    </div>
                    <div className="text-sm bg-white/25 px-4 py-1 rounded-full font-semibold">{content.type}</div>
                    <div className="w-12 h-0.5 bg-white/40 rounded" />
                    {content.example && (
                      <div className="text-sm leading-relaxed max-w-[90%]">
                        <span className="font-bold bg-white/20 px-2 py-0.5 rounded-lg mr-1.5 text-xs">Ví dụ</span>
                        {content.example}
                      </div>
                    )}
                    {content.translation && (
                      <div className="text-sm leading-relaxed max-w-[90%] opacity-90">
                        <span className="font-bold bg-white/20 px-2 py-0.5 rounded-lg mr-1.5 text-xs">Dịch</span>
                        <em>{content.translation}</em>
                      </div>
                    )}
                    <div className="w-12 h-0.5 bg-white/40 rounded" />
                    {content.synonyms?.length > 0 && (
                      <div className="text-sm max-w-[90%]">
                        <span className="font-bold bg-white/20 px-2 py-0.5 rounded-lg mr-1.5 text-xs">Đồng nghĩa</span>
                        {Array.isArray(content.synonyms) ? content.synonyms.join(", ") : content.synonyms}
                      </div>
                    )}
                    {content.antonyms?.length > 0 && (
                      <div className="text-sm max-w-[90%]">
                        <span className="font-bold bg-white/20 px-2 py-0.5 rounded-lg mr-1.5 text-xs">Trái nghĩa</span>
                        {Array.isArray(content.antonyms) ? content.antonyms.join(", ") : content.antonyms}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4 mt-2">
              <Button
                variant="brand"
                size="pill"
                onClick={() => goTo((currentIndex - 1 + cards.length) % cards.length)}
              >
                <ChevronLeft className="w-5 h-5" /> Trước
              </Button>
              <Button
                variant="brand"
                size="pill"
                onClick={() => goTo((currentIndex + 1) % cards.length)}
              >
                Tiếp <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            <div className="text-center text-[#495057] text-lg mt-4 font-semibold">
              Thẻ {currentIndex + 1} / {cards.length}
            </div>

            {/* Jump */}
            <div className="flex items-center justify-center gap-2.5 mt-3 flex-wrap">
              <label className="text-[#495057] font-semibold text-sm">Đi đến thẻ:</label>
              <input
                type="number"
                value={jumpValue}
                min={1}
                max={cards.length}
                onChange={(e) => setJumpValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const n = parseInt(jumpValue);
                    if (n >= 1 && n <= cards.length) { goTo(n - 1); setJumpValue(""); }
                  }
                }}
                className="w-18 px-3 py-2 border-2 border-brand rounded-lg text-sm font-semibold text-center text-brand outline-none w-16"
                placeholder="..."
              />
              <Button
                variant="brand"
                size="sm"
                onClick={() => {
                  const n = parseInt(jumpValue);
                  if (n >= 1 && n <= cards.length) { goTo(n - 1); setJumpValue(""); }
                }}
              >
                Đi
              </Button>
            </div>
            <div className="text-center text-muted-foreground mt-2 text-sm">💡 Nhấn vào thẻ để lật</div>
          </div>
        </div>
      </div>

      {/* Right sidebar */}
      <aside
        className={cn(
          "bg-white border-l-2 border-[#f0e0e7] shadow-[-2px_0_12px_rgba(0,0,0,0.06)] flex flex-col sticky top-[62px] h-[calc(100vh-62px)] transition-all duration-300 overflow-hidden",
          rightCollapsed ? "w-10" : "w-[280px]",
          "hidden md:flex"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b-2 border-[#f0e0e7] flex-shrink-0 gap-2">
          <button
            onClick={() => setRightCollapsed(!rightCollapsed)}
            className="bg-none border-none cursor-pointer text-brand text-xl p-1 rounded-lg hover:bg-brand-light flex-shrink-0"
          >
            {rightCollapsed ? "◀" : "▶"}
          </button>
          {!rightCollapsed && <span className="text-brand font-extrabold text-[1.05em] whitespace-nowrap">📋 Danh sách từ</span>}
        </div>
        {!rightCollapsed && (
          <div className="overflow-y-auto flex-1 p-3">
            {cards.map((c, i) => (
              <div
                key={c.id}
                onClick={() => goTo(i)}
                className={cn(
                  "p-2.5 rounded-xl cursor-pointer transition-all border-2 flex items-center gap-2.5 mb-2",
                  i === currentIndex
                    ? "bg-brand text-white border-brand"
                    : "bg-[#f8f9fa] border-transparent hover:bg-[#ffe5ed] hover:border-brand"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0",
                  i === currentIndex ? "bg-white text-brand" : "bg-brand text-white"
                )}>
                  {i + 1}
                </div>
                <span className="font-semibold text-sm flex-1 truncate">{c.content.word}</span>
                {c.content.cefr && (
                  <span className={cn(
                    "text-[0.7rem] px-1.5 py-0.5 rounded font-bold flex-shrink-0",
                    i === currentIndex ? "bg-white/20 text-white" : getCefrColor(c.content.cefr)
                  )}>
                    {c.content.cefr}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
