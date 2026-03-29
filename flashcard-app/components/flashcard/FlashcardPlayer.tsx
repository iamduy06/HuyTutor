"use client";

/**
 * FlashcardPlayer — port từ Embed Flashcard HTML sang React.
 *
 * Props nhận `tabs` (Tab[]) — cấu trúc giống hệt `const tabs` trong file gốc:
 *   [ { id, label, desc, vocabulary: [ { word, phonetic, ... } ] } ]
 *
 * State mapping:
 *   currentTab  ↔ currentTab (index unit đang chọn)
 *   currentIndex ↔ currentIndex (index từ trong unit đó)
 *   isFlipped   ↔ card.classList.toggle('flipped')
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Volume2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, getCefrColor, toArray } from "@/lib/utils";
import type { Tab, VocabItem } from "@/types";
import { useUIStore } from "@/features/auth/store";
import { FACEBOOK_URL } from "@/lib/constants";
import Link from "next/link";

interface Props {
  tabs: Tab[];
  deckTitle: string;
  deckDesc?: string;
  isDemo?: boolean;
}

// ── TTS ────────────────────────────────────────────────────────────────────

async function fetchDictAudio(word: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
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
  u.lang = "en-US"; u.rate = 0.8;
  window.speechSynthesis.speak(u);
}

// ── Component ──────────────────────────────────────────────────────────────

export function FlashcardPlayer({ tabs, deckTitle, deckDesc, isDemo }: Props) {
  // Giống const state trong HTML gốc:
  const [currentTab,   setCurrentTab]   = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped,    setIsFlipped]    = useState(false);
  const [isFirstLoad,  setIsFirstLoad]  = useState(true);
  const [audioLoading, setAudioLoading] = useState(false);
  const [leftCollapsed,  setLeftCollapsed]  = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [jumpValue, setJumpValue] = useState("");

  const { mode } = useUIStore();
  const isKid = mode === "kid";

  const audioRef  = useRef<HTMLAudioElement | null>(null);
  const tokenRef  = useRef(0);

  // Vocabulary của tab đang chọn
  const vocabulary: VocabItem[] = tabs[currentTab]?.vocabulary ?? [];
  const vocab = vocabulary[currentIndex];

  // ── speakWord (giống speakWord trong HTML) ──
  const speakWord = useCallback(async (text?: string) => {
    const raw = (text ?? vocab?.word ?? "").split("/")[0].replace(/[()]/g, "").trim();
    if (!raw) return;

    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    window.speechSynthesis?.cancel();
    setAudioLoading(true);
    const token = ++tokenRef.current;

    const fallback = () => {
      if (token === tokenRef.current) { setAudioLoading(false); browserTTS(raw); }
    };

    try {
      const url = await Promise.race<string | null>([
        fetchDictAudio(raw),
        new Promise(r => setTimeout(() => r(null), 4000)),
      ]);
      if (token !== tokenRef.current) return;
      if (!url) { fallback(); return; }

      const audio = new Audio(url);
      audioRef.current = audio;
      const t = setTimeout(fallback, 4000);

      audio.oncanplaythrough = () => {
        if (token !== tokenRef.current) { clearTimeout(t); audio.pause(); return; }
        clearTimeout(t); setAudioLoading(false);
        audio.play().catch(fallback);
      };
      audio.onerror = () => { clearTimeout(t); fallback(); };
      audio.load();
    } catch { fallback(); }
  }, [vocab?.word]);

  // Tự động phát sau khi chuyển card (giống HTML gốc: if (!isFirstLoad) setTimeout(speakWord, 300))
  useEffect(() => {
    if (isFirstLoad) { setIsFirstLoad(false); return; }
    const t = setTimeout(() => speakWord(), 300);
    return () => clearTimeout(t);
  }, [currentIndex, currentTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── nextCard / previousCard ──
  function nextCard() {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex(i => (i + 1) % vocabulary.length), 50);
  }
  function prevCard() {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex(i => (i - 1 + vocabulary.length) % vocabulary.length), 50);
  }

  // ── jumpToCard ──
  function jumpToCard() {
    const n = parseInt(jumpValue);
    if (n >= 1 && n <= vocabulary.length) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(n - 1), 50);
      setJumpValue("");
    }
  }

  // ── switchTab (giống switchTab trong HTML) ──
  function switchTab(idx: number) {
    setCurrentTab(idx);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFirstLoad(true);   // không tự phát khi đổi tab
  }

  if (!vocab) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Không có từ vựng nào trong bộ đề này.
      </div>
    );
  }

  const synonyms = toArray(vocab.synonyms);
  const antonyms = toArray(vocab.antonyms);

  return (
    <div className={cn("flex flex-1 min-h-0", isKid && "kid-mode")}>

      {/* ── LEFT SIDEBAR (danh sách unit) ── */}
      <nav className={cn(
        "hidden md:flex flex-col bg-white border-r-2 border-[#f0e0e7] flex-shrink-0",
        "sticky top-0 h-[calc(100vh-62px)] overflow-hidden transition-all duration-300",
        "shadow-[2px_0_12px_rgba(0,0,0,0.06)]",
        leftCollapsed ? "w-[52px]" : "w-[230px]"
      )}>
        <div className="flex items-center justify-between p-4 border-b-2 border-[#f0e0e7] flex-shrink-0">
          {!leftCollapsed && (
            <span className="text-brand font-extrabold text-[1.05em] whitespace-nowrap">📚 Danh sách Unit</span>
          )}
          <button onClick={() => setLeftCollapsed(v => !v)}
            className="bg-none border-none cursor-pointer text-brand text-xl p-1 rounded-lg hover:bg-brand-light ml-auto flex-shrink-0">
            {leftCollapsed ? "▶" : "◀"}
          </button>
        </div>

        <div className="overflow-y-auto flex-1 py-2">
          {tabs.map((tab, i) => (
            <button key={tab.id ?? i} onClick={() => switchTab(i)} title={tab.label}
              className={cn(
                "flex items-center gap-2.5 w-full bg-none border-none py-3 px-3.5 text-left cursor-pointer",
                "font-semibold text-sm text-[#495057] transition-all border-l-[3px] whitespace-nowrap overflow-hidden",
                i === currentTab
                  ? "bg-brand-light text-brand border-brand"
                  : "border-transparent hover:bg-pink-50 hover:text-brand"
              )}>
              <span className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                i === currentTab ? "bg-brand text-white" : "bg-gray-100 text-gray-500"
              )}>{i + 1}</span>
              {!leftCollapsed && <span className="truncate">{tab.label ?? `Unit ${i + 1}`}</span>}
            </button>
          ))}
        </div>
      </nav>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="flex-1 flex flex-col items-center px-4 md:px-[5%] py-8">

          {/* Title */}
          <h1 className={cn("font-extrabold mb-1.5 text-center text-brand",
            isKid ? "text-4xl" : "text-[2em]")}>
            {tabs[currentTab]?.label ?? deckTitle}
          </h1>
          {(tabs[currentTab]?.desc ?? deckDesc) && (
            <p className="text-muted-foreground text-sm mb-5 text-center italic">
              {tabs[currentTab]?.desc ?? deckDesc}
            </p>
          )}

          {isDemo && (
            <div className="mb-4 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700 text-center">
              🎯 Bản demo — tối đa 10 từ.{" "}
              <Link href="/login" className="font-bold text-brand underline">Đăng nhập</Link>
              {" "}để học đầy đủ.
            </div>
          )}

          <div className="w-full max-w-[860px]">

            {/* ── FLASHCARD (giống .card trong HTML) ── */}
            <div className={cn("card-scene mb-6 cursor-pointer", isKid ? "h-[500px]" : "h-[460px]")}
              onClick={() => setIsFlipped(v => !v)}>
              <div className={cn("card-inner w-full h-full", isFlipped && "flipped")}>

                {/* Front */}
                <div className={cn(
                  "card-face bg-white border-2 border-[#e9ecef]",
                  "shadow-[0_5px_20px_rgba(0,0,0,0.1)]",
                  "flex flex-col items-center justify-center p-8 gap-2",
                  isKid ? "rounded-3xl" : "rounded-[20px]"
                )}>
                  {/* CEFR badge */}
                  {vocab.cefr && (
                    <span className={cn("text-xs font-bold px-3 py-1 rounded-full mb-1",
                      getCefrColor(vocab.cefr))}>
                      {vocab.cefr}
                    </span>
                  )}
                  {/* Word */}
                  <div className={cn("font-extrabold text-brand text-center leading-tight",
                    isKid ? "text-6xl" : "text-[2.8em]")}>
                    {vocab.word}
                  </div>
                  {/* Phonetic */}
                  {vocab.phonetic && (
                    <div className="text-muted-foreground text-xl">{vocab.phonetic}</div>
                  )}
                  {/* Audio button */}
                  <button onClick={e => { e.stopPropagation(); speakWord(); }}
                    className="text-[2em] cursor-pointer p-2 transition-transform hover:scale-110"
                    aria-label="Phát âm">
                    {audioLoading
                      ? <Loader2 className="w-8 h-8 animate-spin text-brand" />
                      : "🔊"}
                  </button>
                  <div className="text-muted-foreground text-sm italic">Nhấn để xem nghĩa</div>
                </div>

                {/* Back */}
                <div className={cn(
                  "card-face card-back bg-brand text-white overflow-y-auto",
                  "shadow-[0_5px_20px_rgba(0,0,0,0.1)]",
                  "flex flex-col items-center justify-center p-8",
                  isKid ? "rounded-3xl" : "rounded-[20px]"
                )}>
                  <div className="flex flex-col items-center gap-3 w-full text-center">
                    {/* Meaning */}
                    <div className={cn("font-extrabold leading-tight",
                      isKid ? "text-4xl" : "text-[1.8em]")}>
                      {vocab.meaning}
                    </div>
                    {/* Type */}
                    {vocab.type && (
                      <div className="text-sm bg-white/25 px-4 py-1 rounded-full font-semibold">
                        {vocab.type}
                      </div>
                    )}
                    <div className="w-12 h-0.5 bg-white/40 rounded" />
                    {/* Example */}
                    {vocab.example && (
                      <div className="flex items-start gap-2 max-w-[90%] text-sm leading-relaxed">
                        <div className="flex-1 text-left">
                          <span className="font-bold bg-white/20 px-2 py-0.5 rounded-lg mr-1.5 text-xs">Ví dụ</span>
                          {vocab.example}
                        </div>
                        <button onClick={e => { e.stopPropagation(); speakWord(vocab.example); }}
                          className="flex-shrink-0 p-1 rounded-full hover:bg-white/20">
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {/* Translation */}
                    {vocab.translation && (
                      <div className="max-w-[90%] text-sm italic opacity-90">
                        <span className="font-bold bg-white/20 px-2 py-0.5 rounded-lg mr-1.5 text-xs not-italic">Dịch</span>
                        {vocab.translation}
                      </div>
                    )}
                    <div className="w-12 h-0.5 bg-white/40 rounded" />
                    {/* Synonyms */}
                    {synonyms.length > 0 && (
                      <div className="max-w-[90%] text-sm">
                        <span className="font-bold bg-white/20 px-2 py-0.5 rounded-lg mr-1.5 text-xs">Đồng nghĩa</span>
                        {synonyms.join(", ")}
                      </div>
                    )}
                    {/* Antonyms */}
                    {antonyms.length > 0 && (
                      <div className="max-w-[90%] text-sm">
                        <span className="font-bold bg-white/20 px-2 py-0.5 rounded-lg mr-1.5 text-xs">Trái nghĩa</span>
                        {antonyms.join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Controls (← Trước / Tiếp →) ── */}
            <div className="flex justify-center gap-4 mt-2">
              <Button variant="brand" size="pill" onClick={prevCard}>
                <ChevronLeft className="w-5 h-5" /> Trước
              </Button>
              <Button variant="brand" size="pill" onClick={nextCard}>
                Tiếp <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Counter */}
            <div className="text-center text-[#495057] font-semibold text-lg mt-4">
              Thẻ {currentIndex + 1} / {vocabulary.length}
            </div>

            {/* Jump to card */}
            <div className="flex items-center justify-center gap-2.5 mt-3 flex-wrap">
              <label className="text-[#495057] font-semibold text-sm">Đi đến thẻ:</label>
              <input
                type="number" min={1} max={vocabulary.length}
                value={jumpValue}
                placeholder="..."
                onChange={e => setJumpValue(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") jumpToCard(); }}
                className="w-16 px-3 py-2 border-2 border-brand rounded-lg text-sm font-semibold text-center text-brand outline-none focus:ring-2 focus:ring-brand/30"
              />
              <Button variant="brand" size="sm" onClick={jumpToCard}>Đi</Button>
            </div>
            <div className="text-center text-muted-foreground text-sm mt-2">
              💡 Nhấn vào thẻ để lật
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-4 px-4 text-[#adb5bd] text-xs border-t-2 border-[#f0e0e7] bg-white">
          © Bản quyền thuộc về <strong className="text-[#1a1a2e]">Huy Tutor</strong>
          &nbsp;|&nbsp;
          <a href="https://www.huytutor.io.vn/" target="_blank" rel="noreferrer"
            className="text-brand font-semibold hover:underline">
            www.huytutor.io.vn
          </a>
        </footer>
      </div>

      {/* ── RIGHT SIDEBAR (danh sách từ) ── */}
      <aside className={cn(
        "hidden md:flex flex-col bg-white border-l-2 border-[#f0e0e7] flex-shrink-0",
        "sticky top-0 h-[calc(100vh-62px)] overflow-hidden transition-all duration-300",
        "shadow-[-2px_0_12px_rgba(0,0,0,0.06)]",
        rightCollapsed ? "w-10" : "w-[280px]"
      )}>
        <div className="flex items-center gap-2 p-4 border-b-2 border-[#f0e0e7] flex-shrink-0">
          <button onClick={() => setRightCollapsed(v => !v)}
            className="cursor-pointer text-brand text-xl p-1 rounded-lg hover:bg-brand-light flex-shrink-0">
            {rightCollapsed ? "◀" : "▶"}
          </button>
          {!rightCollapsed && (
            <span className="text-brand font-extrabold text-[1.05em] whitespace-nowrap">📋 Danh sách từ</span>
          )}
        </div>

        {!rightCollapsed && (
          <div className="overflow-y-auto flex-1 p-3">
            {vocabulary.map((v, i) => (
              <div key={i}
                onClick={() => { setIsFlipped(false); setTimeout(() => setCurrentIndex(i), 50); }}
                className={cn(
                  "p-2.5 rounded-xl cursor-pointer transition-all border-2 flex items-center gap-2.5 mb-2",
                  i === currentIndex
                    ? "bg-brand text-white border-brand"
                    : "bg-[#f8f9fa] border-transparent hover:bg-[#ffe5ed] hover:border-brand"
                )}>
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0",
                  i === currentIndex ? "bg-white text-brand" : "bg-brand text-white"
                )}>{i + 1}</div>
                <span className="font-semibold text-sm flex-1 truncate">{v.word}</span>
                {v.cefr && (
                  <span className={cn(
                    "text-[0.7rem] px-1.5 py-0.5 rounded font-bold flex-shrink-0",
                    i === currentIndex ? "bg-white/20 text-white" : getCefrColor(v.cefr)
                  )}>{v.cefr}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
