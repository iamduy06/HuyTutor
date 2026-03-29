"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Volume2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, getCefrColor, toArray } from "@/lib/utils";
import type { FlashcardUnit, VocabItem } from "@/types";
import { useUIStore } from "@/features/auth/store";

interface FlashcardPlayerProps {
  units: FlashcardUnit[];
  deckTitle: string;
  deckDesc?: string;
  isDemo?: boolean;
}

// ── TTS helpers ────────────────────────────────────────────────────────────

async function fetchAudioUrl(word: string): Promise<string | null> {
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

function browserTTS(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US"; u.rate = 0.85;
  window.speechSynthesis.speak(u);
}

// ── Component ──────────────────────────────────────────────────────────────

export function FlashcardPlayer({ units, deckTitle, deckDesc, isDemo }: FlashcardPlayerProps) {
  // Flatten all units to a single vocab list with unit label
  const allVocab: (VocabItem & { _unitLabel?: string })[] = units.flatMap(u =>
    (u.vocabulary ?? []).map(v => ({ ...v, _unitLabel: u.label }))
  );

  const [activeUnit,  setActiveUnit]  = useState(0);
  const [cardIndex,   setCardIndex]   = useState(0);
  const [flipped,     setFlipped]     = useState(false);
  const [audioLoad,   setAudioLoad]   = useState(false);
  const [leftCol,     setLeftCol]     = useState(false);
  const [rightCol,    setRightCol]    = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const { mode } = useUIStore();
  const isKid = mode === "kid";

  const audioRef  = useRef<HTMLAudioElement | null>(null);
  const tokenRef  = useRef(0);

  const unitVocab: VocabItem[] = units[activeUnit]?.vocabulary ?? [];
  const currentWord = unitVocab[cardIndex];

  const speakWord = useCallback(async (word?: string) => {
    const raw = (word ?? currentWord?.word ?? "").split("/")[0].replace(/[()]/g, "").trim();
    if (!raw) return;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    window.speechSynthesis?.cancel();
    setAudioLoad(true);
    const token = ++tokenRef.current;

    const fallbackTTS = () => { if (token === tokenRef.current) { setAudioLoad(false); browserTTS(raw); } };

    try {
      const url = await Promise.race([
        fetchAudioUrl(raw),
        new Promise<null>(r => setTimeout(() => r(null), 4000)),
      ]);
      if (token !== tokenRef.current) return;
      if (!url) { fallbackTTS(); return; }

      const audio = new Audio(url);
      audioRef.current = audio;
      const timeout = setTimeout(fallbackTTS, 4000);

      audio.oncanplaythrough = () => {
        if (token !== tokenRef.current) { clearTimeout(timeout); audio.pause(); return; }
        clearTimeout(timeout); setAudioLoad(false);
        audio.play().catch(fallbackTTS);
      };
      audio.onerror = () => { clearTimeout(timeout); fallbackTTS(); };
      audio.load();
    } catch { fallbackTTS(); }
  }, [currentWord]);

  useEffect(() => {
    if (isFirstLoad) { setIsFirstLoad(false); return; }
    if (currentWord?.word) { const t = setTimeout(() => speakWord(), 350); return () => clearTimeout(t); }
  }, [cardIndex, activeUnit]);

  function goTo(index: number) {
    setFlipped(false);
    setTimeout(() => setCardIndex(index), 50);
  }

  function switchUnit(idx: number) {
    setActiveUnit(idx); setCardIndex(0); setFlipped(false); setIsFirstLoad(true);
  }

  if (!currentWord) {
    return <div className="text-center py-20 text-muted-foreground">Không có từ vựng nào</div>;
  }

  const synonyms = toArray(currentWord.synonyms);
  const antonyms = toArray(currentWord.antonyms);

  return (
    <div className={cn("flex flex-1 min-h-0", isKid && "kid-mode")}>
      {/* Left sidebar */}
      <nav className={cn(
        "bg-white border-r-2 border-[#f0e0e7] flex flex-col flex-shrink-0 transition-all duration-300 overflow-hidden sticky top-0 h-full hidden md:flex",
        leftCol ? "w-[52px]" : "w-[230px]"
      )}>
        <div className="flex items-center justify-between p-3 border-b-2 border-[#f0e0e7] flex-shrink-0">
          {!leftCol && <span className="text-brand font-extrabold text-sm truncate">📚 Units</span>}
          <button onClick={() => setLeftCol(v => !v)} className="p-1 rounded-lg hover:bg-brand-light text-brand flex-shrink-0 ml-auto">
            {leftCol ? "▶" : "◀"}
          </button>
        </div>
        <div className="overflow-y-auto flex-1 py-2">
          {units.map((u, i) => (
            <button key={i} onClick={() => switchUnit(i)} title={u.label}
              className={cn(
                "flex items-center gap-2.5 w-full text-left px-3 py-2.5 text-sm font-semibold transition-all border-l-[3px]",
                i === activeUnit ? "bg-brand-light text-brand border-brand" : "text-[#495057] hover:bg-pink-50 hover:text-brand border-transparent"
              )}>
              <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                i === activeUnit ? "bg-brand text-white" : "bg-gray-100 text-gray-500"
              )}>{i + 1}</span>
              {!leftCol && <span className="truncate">{u.label ?? `Unit ${i + 1}`}</span>}
            </button>
          ))}
        </div>
      </nav>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="flex-1 flex flex-col items-center py-8 px-4">
          <h1 className={cn("font-extrabold mb-1 text-center text-brand", isKid ? "text-4xl" : "text-3xl")}>
            {units[activeUnit]?.label ?? deckTitle}
          </h1>
          {(units[activeUnit]?.desc ?? deckDesc) && (
            <p className="text-muted-foreground text-sm mb-5 text-center italic">
              {units[activeUnit]?.desc ?? deckDesc}
            </p>
          )}

          {isDemo && (
            <div className="mb-4 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700 text-center">
              Bản demo — xem thử
            </div>
          )}

          <div className="w-full max-w-[860px]">
            {/* Card */}
            <div className={cn("card-scene mb-5 cursor-pointer", isKid ? "h-[500px]" : "h-[460px]")}
              onClick={() => setFlipped(v => !v)}>
              <div className={cn("card-inner w-full h-full", flipped && "flipped")}>
                {/* Front */}
                <div className={cn("card-face bg-white border-2 border-[#e9ecef] shadow-[0_5px_20px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center gap-2 p-8",
                  isKid ? "rounded-3xl" : "rounded-[20px]")}>
                  {currentWord.cefr && (
                    <span className={cn("text-xs font-bold px-3 py-1 rounded-full", getCefrColor(currentWord.cefr))}>{currentWord.cefr}</span>
                  )}
                  <div className={cn("font-extrabold text-brand text-center", isKid ? "text-6xl" : "text-5xl")}>{currentWord.word}</div>
                  {currentWord.phonetic && <div className="text-muted-foreground text-xl">{currentWord.phonetic}</div>}
                  <button onClick={e => { e.stopPropagation(); speakWord(); }} aria-label="Phát âm"
                    className="text-4xl p-2 transition-transform hover:scale-110">
                    {audioLoad ? <Loader2 className="w-8 h-8 animate-spin text-brand" /> : "🔊"}
                  </button>
                  <div className="text-muted-foreground text-sm italic">Nhấn để xem nghĩa</div>
                </div>

                {/* Back */}
                <div className={cn("card-face card-back bg-brand text-white shadow-[0_5px_20px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center gap-3 p-8 overflow-y-auto",
                  isKid ? "rounded-3xl" : "rounded-[20px]")}>
                  <div className={cn("font-extrabold text-center", isKid ? "text-4xl" : "text-3xl")}>{currentWord.meaning}</div>
                  {currentWord.type && <div className="text-sm bg-white/25 px-4 py-1 rounded-full font-semibold">{currentWord.type}</div>}
                  <div className="w-12 h-0.5 bg-white/40 rounded" />
                  {currentWord.example && (
                    <div className="flex items-start gap-2 max-w-[90%] text-sm leading-relaxed">
                      <div className="flex-1"><span className="font-bold bg-white/20 px-2 py-0.5 rounded-lg mr-1.5 text-xs">Ví dụ</span>{currentWord.example}</div>
                      <button onClick={e => { e.stopPropagation(); speakWord(currentWord.example); }}
                        className="flex-shrink-0 p-1 rounded-full hover:bg-white/20"><Volume2 className="w-4 h-4" /></button>
                    </div>
                  )}
                  {currentWord.translation && (
                    <div className="max-w-[90%] text-sm italic opacity-90 text-center">
                      <span className="font-bold bg-white/20 px-2 py-0.5 rounded-lg mr-1.5 text-xs not-italic">Dịch</span>
                      {currentWord.translation}
                    </div>
                  )}
                  {(synonyms.length > 0 || antonyms.length > 0) && <div className="w-12 h-0.5 bg-white/40 rounded" />}
                  {synonyms.length > 0 && (
                    <div className="max-w-[90%] text-sm text-center">
                      <span className="font-bold bg-white/20 px-2 py-0.5 rounded-lg mr-1.5 text-xs">Đồng nghĩa</span>{synonyms.join(", ")}
                    </div>
                  )}
                  {antonyms.length > 0 && (
                    <div className="max-w-[90%] text-sm text-center">
                      <span className="font-bold bg-white/20 px-2 py-0.5 rounded-lg mr-1.5 text-xs">Trái nghĩa</span>{antonyms.join(", ")}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4">
              <Button variant="brand" size="pill" onClick={() => goTo(cardIndex - 1)} disabled={cardIndex === 0} className="disabled:opacity-40">
                <ChevronLeft className="w-5 h-5" /> Trước
              </Button>
              <Button variant="brand" size="pill" onClick={() => goTo(cardIndex + 1)} disabled={cardIndex >= unitVocab.length - 1} className="disabled:opacity-40">
                Tiếp <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
            <div className="text-center text-[#495057] text-base mt-4 font-semibold">
              Thẻ {cardIndex + 1} / {unitVocab.length}
            </div>
            <div className="flex items-center justify-center gap-2.5 mt-3 flex-wrap">
              <label className="text-[#495057] font-semibold text-sm">Đi đến thẻ:</label>
              <input type="number" min={1} max={unitVocab.length} placeholder="..."
                onKeyDown={e => {
                  if (e.key !== "Enter") return;
                  const n = parseInt((e.target as HTMLInputElement).value, 10);
                  if (n >= 1 && n <= unitVocab.length) { goTo(n - 1); (e.target as HTMLInputElement).value = ""; }
                }}
                className="w-16 px-3 py-2 border-2 border-brand rounded-lg text-sm font-semibold text-center text-brand outline-none" />
              <p className="text-center text-muted-foreground text-sm">💡 Nhấn vào thẻ để lật</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right sidebar */}
      <aside className={cn(
        "bg-white border-l-2 border-[#f0e0e7] flex flex-col flex-shrink-0 transition-all duration-300 overflow-hidden sticky top-0 h-full hidden md:flex",
        rightCol ? "w-10" : "w-[280px]"
      )}>
        <div className="flex items-center gap-2 p-3 border-b-2 border-[#f0e0e7] flex-shrink-0">
          <button onClick={() => setRightCol(v => !v)} className="p-1 rounded-lg hover:bg-brand-light text-brand flex-shrink-0">
            {rightCol ? "◀" : "▶"}
          </button>
          {!rightCol && <span className="text-brand font-extrabold text-sm truncate">📋 Danh sách từ</span>}
        </div>
        {!rightCol && (
          <div className="overflow-y-auto flex-1 p-2">
            {unitVocab.map((v, i) => (
              <button key={i} onClick={() => { setFlipped(false); setTimeout(() => setCardIndex(i), 50); }}
                className={cn(
                  "w-full flex items-center gap-2.5 p-2.5 rounded-xl mb-1.5 border-2 transition-all text-left",
                  i === cardIndex ? "bg-brand text-white border-brand" : "bg-[#f8f9fa] border-transparent hover:bg-[#ffe5ed] hover:border-brand"
                )}>
                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0",
                  i === cardIndex ? "bg-white text-brand" : "bg-brand text-white")}>{i + 1}</div>
                <span className="font-semibold text-sm flex-1 truncate">{v.word}</span>
                {v.cefr && (
                  <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0",
                    i === cardIndex ? "bg-white/20 text-white" : getCefrColor(v.cefr))}>{v.cefr}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
