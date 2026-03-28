"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { FlashcardUnit, VocabWord, RawFlashcardContent, normalizeUnits } from "@/types";
import { cn, cefrColor } from "@/lib/utils";
import { useUIStore } from "@/features/auth/uiStore";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

// ── TTS helpers ────────────────────────────────────────────────────────────

async function fetchDictAudio(word: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (!res.ok) return null;
    const data: Array<{ phonetics?: Array<{ audio?: string }> }> = await res.json();
    for (const entry of data) {
      for (const ph of entry.phonetics ?? []) {
        if (ph.audio?.includes("us")) return ph.audio;
      }
      for (const ph of entry.phonetics ?? []) {
        if (ph.audio?.trim()) return ph.audio;
      }
    }
  } catch { /* network error — fall through to TTS */ }
  return null;
}

function speakBrowser(word: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(word);
  u.lang = "en-US";
  u.rate = 0.85;
  window.speechSynthesis.speak(u);
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);
}

// ── Component ──────────────────────────────────────────────────────────────

interface Props {
  /** Raw JSONB content — can be object (1 unit) or array (many units) */
  rawContent: RawFlashcardContent;
  isLimited?: boolean;
}

export function FlashcardPlayer({ rawContent, isLimited = false }: Props) {
  const { mode } = useUIStore();
  const isKid = mode === "kid";

  // Normalize JSONB once
  const units: FlashcardUnit[] = normalizeUnits(rawContent);

  const [unitIdx, setUnitIdx] = useState(0);
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  const tokenRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const vocab: VocabWord[] = units[unitIdx]?.vocabulary ?? [];
  const word = vocab[cardIdx];

  // Auto-speak on card change (skip first load)
  const firstLoad = useRef(true);
  useEffect(() => {
    if (firstLoad.current) { firstLoad.current = false; return; }
    if (!word) return;
    const t = setTimeout(() => speak(), 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardIdx, unitIdx]);

  const speak = useCallback(async () => {
    if (!word) return;
    const raw = word.word.split("/")[0].replace(/[()]/g, "").trim();

    audioRef.current?.pause();
    audioRef.current = null;
    window.speechSynthesis?.cancel();

    setAudioLoading(true);
    const token = ++tokenRef.current;

    try {
      const url = await withTimeout(fetchDictAudio(raw), 5000);
      if (token !== tokenRef.current) return;

      if (url) {
        const audio = new Audio(url);
        audioRef.current = audio;

        const fallback = setTimeout(() => {
          if (token !== tokenRef.current) return;
          audio.pause();
          setAudioLoading(false);
          speakBrowser(raw);
        }, 5000);

        audio.oncanplaythrough = () => {
          if (token !== tokenRef.current) { clearTimeout(fallback); return; }
          clearTimeout(fallback);
          setAudioLoading(false);
          audio.play().catch(() => speakBrowser(raw));
        };
        audio.onerror = () => { clearTimeout(fallback); setAudioLoading(false); speakBrowser(raw); };
        audio.load();
        return;
      }
      throw new Error("no url");
    } catch {
      if (token !== tokenRef.current) return;
      setAudioLoading(false);
      speakBrowser(raw);
    }
  }, [word]);

  function goNext() { setFlipped(false); setTimeout(() => setCardIdx(i => (i + 1) % vocab.length), 40); }
  function goPrev() { setFlipped(false); setTimeout(() => setCardIdx(i => (i - 1 + vocab.length) % vocab.length), 40); }
  function switchUnit(i: number) { setUnitIdx(i); setCardIdx(0); setFlipped(false); }

  const synonyms = Array.isArray(word?.synonyms) ? word.synonyms.join(", ") : (word?.synonyms ?? "");
  const antonyms = Array.isArray(word?.antonyms) ? word.antonyms.join(", ") : (word?.antonyms ?? "");

  if (!word) {
    return (
      <div className="flex flex-1 items-center justify-center flex-col gap-3 text-gray-400">
        <div className="text-5xl">📭</div>
        <p>Không có từ vựng trong unit này</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-1 overflow-hidden", isKid && "kid-mode")}>
      {/* ── Left sidebar: Units ── */}
      <nav className={cn("flex flex-col flex-shrink-0 border-r-2 border-gray-100 bg-white transition-all duration-300", leftOpen ? "w-[220px]" : "w-[52px]")}>
        <div className="flex flex-shrink-0 items-center justify-between border-b-2 border-gray-100 p-3">
          {leftOpen && <span className="truncate text-sm font-bold text-brand-red">📚 Danh sách Unit</span>}
          <button onClick={() => setLeftOpen(v => !v)} className="ml-auto flex-shrink-0 rounded-lg p-1 text-brand-red hover:bg-brand-red-light">
            {leftOpen ? "◀" : "▶"}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {units.map((unit, i) => (
            <button key={unit.id ?? i} onClick={() => switchUnit(i)} title={unit.label}
              className={cn("flex w-full items-center gap-2 border-l-[3px] px-3 py-2.5 text-sm font-semibold transition-all",
                i === unitIdx ? "border-brand-red bg-brand-red-light text-brand-red" : "border-transparent text-gray-600 hover:bg-pink-50 hover:text-brand-red"
              )}>
              <span className={cn("flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold",
                i === unitIdx ? "bg-brand-red text-white" : "bg-gray-100 text-gray-500"
              )}>{i + 1}</span>
              {leftOpen && <span className="truncate">{unit.label}</span>}
            </button>
          ))}
        </div>
      </nav>

      {/* ── Main ── */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex flex-1 flex-col items-center px-4 py-8">
          <h1 className={cn("mb-1 text-center font-extrabold text-brand-red", isKid ? "text-4xl" : "text-3xl")}>
            {units[unitIdx]?.label}
          </h1>
          <p className="mb-4 text-center text-sm italic text-gray-500">{units[unitIdx]?.desc}</p>

          {isLimited && (
            <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-700">
              ⚠️ Xem thử — chỉ hiển thị {vocab.length} thẻ đầu.{" "}
              <a href="https://web.facebook.com/huytutor" target="_blank" rel="noopener noreferrer" className="font-bold underline">Liên hệ mở khoá</a>
            </div>
          )}

          {/* Card */}
          <div className="w-full max-w-2xl">
            <div className="card-scene" style={{ height: isKid ? "520px" : "460px" }}>
              <div className={cn("card-inner", flipped && "flipped")} onClick={() => setFlipped(v => !v)}>
                {/* Front */}
                <div className="card-face flex flex-col items-center justify-center gap-3 border-2 border-gray-100 bg-white p-8 shadow-md">
                  <div className={cn("fc-word text-center font-extrabold text-brand-red", isKid ? "text-5xl" : "text-4xl")}>
                    {word.word}
                  </div>
                  <div className="text-lg text-gray-500">{word.phonetic}</div>
                  {word.cefr && (
                    <span className={cn("rounded-full px-3 py-0.5 text-xs font-bold", cefrColor(word.cefr))}>
                      {word.cefr}
                    </span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); speak(); }}
                    disabled={audioLoading}
                    className="mt-1 rounded-full p-2 text-3xl transition-transform hover:scale-110 disabled:opacity-50"
                  >
                    {audioLoading ? <Loader2 className="h-7 w-7 animate-spin text-brand-red" /> : "🔊"}
                  </button>
                  <span className="text-sm italic text-gray-400">Nhấn để xem nghĩa</span>
                </div>

                {/* Back */}
                <div className="card-back card-face flex flex-col items-center justify-center gap-3 overflow-y-auto bg-brand-red p-8 text-white shadow-md">
                  <div className={cn("fc-meaning text-center font-extrabold", isKid ? "text-3xl" : "text-2xl")}>
                    {word.meaning}
                  </div>
                  <span className="rounded-full bg-white/20 px-4 py-1 text-sm font-semibold">{word.type}</span>
                  <div className="h-0.5 w-12 rounded-full bg-white/40" />
                  {word.example && (
                    <p className="max-w-[90%] text-center text-sm leading-relaxed">
                      <span className="mr-1 rounded-lg bg-white/20 px-2 py-0.5 text-xs font-bold">Ví dụ</span>
                      {word.example}
                    </p>
                  )}
                  {word.translation && (
                    <p className="max-w-[90%] text-center text-sm italic leading-relaxed opacity-90">
                      <span className="mr-1 rounded-lg bg-white/20 px-2 py-0.5 text-xs font-bold not-italic">Dịch</span>
                      {word.translation}
                    </p>
                  )}
                  <div className="h-0.5 w-12 rounded-full bg-white/40" />
                  {synonyms && (
                    <p className="max-w-[90%] text-center text-sm">
                      <span className="mr-1 rounded-lg bg-white/20 px-2 py-0.5 text-xs font-bold">Đồng nghĩa</span>
                      {synonyms}
                    </p>
                  )}
                  {antonyms && (
                    <p className="max-w-[90%] text-center text-sm">
                      <span className="mr-1 rounded-lg bg-white/20 px-2 py-0.5 text-xs font-bold">Trái nghĩa</span>
                      {antonyms}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="mt-5 flex justify-center gap-4">
              <Button onClick={goPrev} size="lg"><ChevronLeft className="mr-1 h-5 w-5" />Trước</Button>
              <Button onClick={goNext} size="lg">Tiếp<ChevronRight className="ml-1 h-5 w-5" /></Button>
            </div>
            <p className="mt-3 text-center text-base font-semibold text-gray-600">
              Thẻ {cardIdx + 1} / {vocab.length}
            </p>

            {/* Jump */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <span className="text-sm font-semibold text-gray-600">Đi đến thẻ:</span>
              <input
                type="number" min={1} max={vocab.length} placeholder="..."
                className="w-20 rounded-xl border-2 border-brand-red px-2 py-1.5 text-center text-sm font-bold text-brand-red outline-none"
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  const n = parseInt((e.target as HTMLInputElement).value);
                  if (n >= 1 && n <= vocab.length) { setFlipped(false); setTimeout(() => setCardIdx(n - 1), 40); }
                  (e.target as HTMLInputElement).value = "";
                }}
              />
            </div>
            <p className="mt-2 text-center text-xs text-gray-400">💡 Nhấn vào thẻ để lật</p>
          </div>
        </div>
      </div>

      {/* ── Right sidebar: Word list ── */}
      <aside className={cn("flex flex-col flex-shrink-0 border-l-2 border-gray-100 bg-white transition-all duration-300", rightOpen ? "w-[260px]" : "w-[40px]")}>
        <div className="flex flex-shrink-0 items-center gap-2 border-b-2 border-gray-100 p-3">
          <button onClick={() => setRightOpen(v => !v)} className="flex-shrink-0 rounded-lg p-1 text-brand-red hover:bg-brand-red-light">
            {rightOpen ? "▶" : "◀"}
          </button>
          {rightOpen && <span className="truncate text-sm font-bold text-brand-red">📋 Danh sách từ</span>}
        </div>
        {rightOpen && (
          <div className="flex-1 overflow-y-auto p-2">
            {vocab.map((v, i) => (
              <button key={i} onClick={() => { setFlipped(false); setTimeout(() => setCardIdx(i), 40); }}
                className={cn("mb-1.5 flex w-full items-center gap-2 rounded-xl border-2 p-2.5 text-left transition-all",
                  i === cardIdx ? "border-brand-red bg-brand-red text-white" : "border-transparent bg-gray-50 hover:border-brand-red hover:bg-pink-50"
                )}>
                <span className={cn("flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  i === cardIdx ? "bg-white text-brand-red" : "bg-brand-red text-white"
                )}>{i + 1}</span>
                <span className="flex-1 truncate text-sm font-semibold">{v.word}</span>
                {v.cefr && (
                  <span className={cn("flex-shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold",
                    i === cardIdx ? "bg-white/20 text-white" : cefrColor(v.cefr)
                  )}>{v.cefr}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
