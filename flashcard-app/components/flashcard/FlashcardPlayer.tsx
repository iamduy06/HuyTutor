"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Volume2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, getCefrColor, toArray } from "@/lib/utils";
import type { Tab, VocabItem } from "@/types";
import { useUIStore } from "@/features/auth/store";
import { FACEBOOK_URL } from "@/lib/constants";
import Link from "next/link";

interface Props {
  deckId?: string;   // undefined = demo mode, không save progress
  tabs: Tab[];
  deckTitle: string;
  deckDesc?: string;
  isDemo?: boolean;
}

// ── TTS ─────────────────────────────────────────────────────────

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

// ── Component ────────────────────────────────────────────────────

export function FlashcardPlayer({ tabs, deckTitle, deckDesc, isDemo, deckId }: Props) {
  const [currentTab,   setCurrentTab]   = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped,    setIsFlipped]    = useState(false);
  const [isFirstLoad,  setIsFirstLoad]  = useState(true);
  const [audioLoading, setAudioLoading] = useState(false);
  const [leftCollapsed,  setLeftCollapsed]  = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [jumpValue, setJumpValue] = useState("");

  const { mode } = useUIStore();
  const seenCards = useRef<Set<string>>(new Set());
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track seen vocabulary items (word + tab combo)
  const markSeen = useCallback((tabIdx: number, cardIdx: number) => {
    const key = `${tabIdx}-${cardIdx}`;
    seenCards.current.add(key);
  }, []);

  // Save progress to DB (debounced, every 3 card navigations or on unmount)
  const saveProgress = useCallback(async () => {
    if (!deckId || isDemo) return;
    const totalCards = tabs.reduce((s, t) => s + (t.vocabulary?.length ?? 0), 0);
    if (totalCards === 0) return;

    const learnedCount   = seenCards.current.size;
    const progressPercent = Math.round((learnedCount / totalCards) * 100);

    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deck_id:          deckId,
          learned_count:    learnedCount,
          progress_percent: progressPercent,
        }),
      });
    } catch { /* silent — non-critical */ }
  }, [deckId, isDemo, tabs]);

  // Save on unmount
  useEffect(() => {
    return () => { saveProgress(); };
  }, [saveProgress]);


  const isKid = mode === "kid";

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tokenRef = useRef(0);

  const vocabulary: VocabItem[] = tabs[currentTab]?.vocabulary ?? [];

  // Mark first card as seen on mount
  useEffect(() => {
    if (vocabulary.length > 0) markSeen(0, 0);
  }, []); // eslint-disable-line
  const vocab = vocabulary[currentIndex];

  // ── TTS ──
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
        new Promise<string | null>(r => setTimeout(() => r(null), 4000)),
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

  useEffect(() => {
    if (isFirstLoad) { setIsFirstLoad(false); return; }
    const t = setTimeout(() => speakWord(), 300);
    return () => clearTimeout(t);
  }, [currentIndex, currentTab]); // eslint-disable-line

  function nextCard() {
    const next = (currentIndex + 1) % vocabulary.length;
    markSeen(currentTab, next);
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex(next), 50);
    // Save every 5 navigations
    if ((seenCards.current.size % 5) === 0) saveProgress();
  }
  function prevCard() {
    const prev = (currentIndex - 1 + vocabulary.length) % vocabulary.length;
    markSeen(currentTab, prev);
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex(prev), 50);
  }
  function jumpToCard() {
    const n = parseInt(jumpValue);
    if (n >= 1 && n <= vocabulary.length) {
      markSeen(currentTab, n - 1);
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(n - 1), 50);
      setJumpValue("");
    }
  }
  function switchTab(idx: number) {
    saveProgress(); // save khi đổi tab
    setCurrentTab(idx); setCurrentIndex(0); setIsFlipped(false); setIsFirstLoad(true);
    markSeen(idx, 0); // mark first card of new tab
  }

  if (!vocab) {
    return (
      <div className={cn("flex items-center justify-center py-20 text-muted-foreground", isKid && "kid-mode")}>
        Không có từ vựng nào trong bộ đề này.
      </div>
    );
  }

  const synonyms = toArray(vocab.synonyms);
  const antonyms = toArray(vocab.antonyms);

  return (
    <div className={cn("flex flex-col flex-1 min-h-0 relative", isKid && "kid-mode")}>

      {/* ══ MOBILE: vertical layout (< md) ══════════════════════════════ */}
      {/* Unit list accordion - mobile only */}
      <details className="md:hidden bg-white border-b-2 border-[#f0e0e7]">
        <summary className={cn(
          "flex items-center gap-2 px-4 py-3 cursor-pointer font-extrabold select-none list-none",
          isKid ? "text-purple-600 text-base" : "text-brand text-sm"
        )}>
          <span>{isKid ? "🎯 Chủ đề" : "📚 Danh sách Unit"}</span>
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            {tabs[currentTab]?.label ?? `Unit ${currentTab + 1}`}
          </span>
          <span className="text-brand text-xs">▼</span>
        </summary>
        <div className="border-t border-[#f0e0e7] divide-y divide-[#f0e0e7] max-h-48 overflow-y-auto">
          {tabs.map((tab, i) => (
            <button key={tab.id ?? i} onClick={() => switchTab(i)}
              className={cn(
                "flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm font-semibold transition-colors",
                i === currentTab
                  ? isKid ? "bg-purple-50 text-purple-600" : "bg-brand-light text-brand"
                  : "hover:bg-gray-50 text-[#495057]"
              )}>
              <span className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                i === currentTab
                  ? isKid ? "bg-purple-200 text-purple-700" : "bg-brand text-white"
                  : "bg-gray-200 text-gray-600"
              )}>{i + 1}</span>
              <span className="truncate">{tab.label ?? `Unit ${i + 1}`}</span>
              {tab.vocabulary && (
                <span className="ml-auto text-xs text-muted-foreground flex-shrink-0">
                  {tab.vocabulary.length} từ
                </span>
              )}
            </button>
          ))}
        </div>
      </details>

      {/* ══ DESKTOP: horizontal 3-column layout (md+) ═════════════════════ */}
      <div className="flex flex-1 min-h-0">

      {/* ── LEFT SIDEBAR ── */}
      <nav className={cn(
        "hidden md:flex flex-col bg-white border-r-2 border-[#f0e0e7] flex-shrink-0",
        "sticky top-0 h-[calc(100vh-62px)] overflow-hidden transition-all duration-300",
        leftCollapsed ? "w-[52px]" : "w-[230px]"
      )}>
        <div className="flex items-center justify-between p-4 border-b-2 border-[#f0e0e7] flex-shrink-0">
          {!leftCollapsed && (
            <span className={cn("font-extrabold text-[1.05em] whitespace-nowrap",
              isKid ? "text-purple-600 text-lg" : "text-brand")}>
              {isKid ? "🎯 Chủ đề" : "📚 Danh sách Unit"}
            </span>
          )}
          <button onClick={() => setLeftCollapsed(v => !v)}
            className="cursor-pointer text-brand text-xl p-1 rounded-lg hover:bg-brand-light ml-auto flex-shrink-0">
            {leftCollapsed ? "▶" : "◀"}
          </button>
        </div>
        <div className="overflow-y-auto flex-1 py-2">
          {tabs.map((tab, i) => (
            <button key={tab.id ?? i} onClick={() => switchTab(i)} title={tab.label}
              className={cn(
                "flex items-center gap-2.5 w-full py-3 px-3.5 text-left cursor-pointer",
                "font-semibold text-sm transition-all border-l-[3px] whitespace-nowrap overflow-hidden",
                isKid ? "text-base" : "text-[#495057]",
                i === currentTab
                  ? cn("border-brand", isKid ? "kid-word-item active" : "bg-brand-light text-brand")
                  : cn("border-transparent", isKid ? "kid-word-item hover:text-purple-600" : "hover:bg-pink-50 hover:text-brand")
              )}>
              <span className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                i === currentTab
                  ? isKid ? "bg-white text-purple-600 shadow" : "bg-brand text-white"
                  : isKid ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-500"
              )}>{i + 1}</span>
              {!leftCollapsed && <span className="truncate">{tab.label ?? `Unit ${i + 1}`}</span>}
            </button>
          ))}
        </div>
      </nav>

      {/* ── MAIN (desktop) ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="flex-1 flex flex-col items-center px-4 md:px-[5%] py-8">

          {/* Title */}
          <h1 className={cn(
            "font-extrabold mb-1.5 text-center",
            isKid ? "text-5xl kid-header" : "text-[2em] text-brand"
          )}>
            {tabs[currentTab]?.label ?? deckTitle}
          </h1>
          {(tabs[currentTab]?.desc ?? deckDesc) && (
            <p className={cn("text-sm mb-5 text-center italic",
              isKid ? "text-purple-500 text-base font-semibold" : "text-muted-foreground")}>
              {tabs[currentTab]?.desc ?? deckDesc}
            </p>
          )}

          {isDemo && (
            <div className={cn("mb-4 px-4 py-2 rounded-xl text-sm text-center",
              isKid
                ? "bg-yellow-50 border-2 border-yellow-300 text-yellow-700 font-bold text-base"
                : "bg-yellow-50 border border-yellow-200 text-yellow-700")}>
              {isKid ? "🎁 Bản thử — " : "🎯 Bản demo — "}
              tối đa 10 từ.{" "}
              <Link href="/login" className={cn("font-bold underline", isKid ? "text-purple-600" : "text-brand")}>
                Đăng nhập
              </Link>{" "}để học đầy đủ.
            </div>
          )}

          <div className="w-full max-w-[860px]">

            {/* ── CARD ── */}
            <div className={cn(
                "card-scene mb-6 cursor-pointer relative",
                isKid ? "h-[520px]" : "h-[460px]"
              )}
              onClick={() => setIsFlipped(v => !v)}>
              <div className={cn("card-inner w-full h-full", isFlipped && "flipped")}>

                {/* Front */}
                <div className={cn(
                  "card-face flex flex-col items-center justify-center p-8 gap-3",
                  isKid ? "rounded-[28px]" : "rounded-[20px] bg-white border-2 border-[#e9ecef] shadow-[0_5px_20px_rgba(0,0,0,0.1)]"
                )}>
                  {vocab.cefr && (
                    <span className={cn(
                      "font-bold px-3 py-1 rounded-full",
                      isKid ? "kid-cefr text-base" : "text-xs",
                      getCefrColor(vocab.cefr)
                    )}>
                      {vocab.cefr}
                    </span>
                  )}

                  <div className={cn(
                    "font-extrabold text-center leading-tight",
                    isKid ? "kid-word" : "text-[2.8em] text-brand"
                  )}>
                    {vocab.word}
                  </div>

                  {vocab.phonetic && (
                    <div className={cn(
                      "text-center",
                      isKid ? "kid-phonetic" : "text-muted-foreground text-xl"
                    )}>
                      {vocab.phonetic}
                    </div>
                  )}

                  <button onClick={e => { e.stopPropagation(); speakWord(); }}
                    className={cn(
                      "cursor-pointer p-2 transition-transform hover:scale-110",
                      isKid ? "text-5xl" : "text-[2em]"
                    )}>
                    {audioLoading
                      ? <Loader2 className={cn("animate-spin text-brand", isKid ? "w-12 h-12" : "w-8 h-8")} />
                      : "🔊"}
                  </button>

                  <div className={cn(isKid ? "kid-hint" : "text-muted-foreground text-sm italic")}>
                    {isKid ? "👆 Nhấn để lật thẻ!" : "Nhấn để xem nghĩa"}
                  </div>
                </div>

                {/* Back */}
                <div className={cn(
                  "card-face card-back overflow-y-auto",
                  "flex flex-col items-center justify-center p-8",
                  isKid ? "rounded-[28px]" : "rounded-[20px] bg-brand text-white shadow-[0_5px_20px_rgba(0,0,0,0.1)]",
                  "text-white"
                )}>
                  <div className="flex flex-col items-center gap-3 w-full text-center">
                    <div className={cn(
                      "font-extrabold leading-tight",
                      isKid ? "kid-meaning" : "text-[1.8em]"
                    )}>
                      {vocab.meaning}
                    </div>

                    {vocab.type && (
                      <div className={cn(
                        "bg-white/25 px-4 py-1 rounded-full font-semibold",
                        isKid ? "text-lg" : "text-sm"
                      )}>
                        {vocab.type}
                      </div>
                    )}

                    <div className="w-12 h-0.5 bg-white/40 rounded" />

                    {vocab.example && (
                      <div className="flex items-start gap-2 max-w-[90%]">
                        <div className={cn("flex-1 text-left leading-relaxed", isKid ? "text-lg" : "text-sm")}>
                          <span className={cn(
                            "font-bold bg-white/20 px-2 py-0.5 rounded-lg mr-1.5",
                            isKid ? "text-sm" : "text-xs"
                          )}>Ví dụ</span>
                          {vocab.example}
                        </div>
                        <button onClick={e => { e.stopPropagation(); speakWord(vocab.example); }}
                          className="flex-shrink-0 p-1 rounded-full hover:bg-white/20">
                          <Volume2 className={isKid ? "w-6 h-6" : "w-4 h-4"} />
                        </button>
                      </div>
                    )}

                    {vocab.translation && (
                      <div className={cn(
                        "max-w-[90%] italic opacity-90",
                        isKid ? "text-lg" : "text-sm"
                      )}>
                        <span className={cn(
                          "font-bold bg-white/20 px-2 py-0.5 rounded-lg mr-1.5 not-italic",
                          isKid ? "text-sm" : "text-xs"
                        )}>Dịch</span>
                        {vocab.translation}
                      </div>
                    )}

                    {(synonyms.length > 0 || antonyms.length > 0) && (
                      <div className="w-12 h-0.5 bg-white/40 rounded" />
                    )}

                    {synonyms.length > 0 && (
                      <div className={cn("max-w-[90%]", isKid ? "text-lg" : "text-sm")}>
                        <span className={cn(
                          "font-bold bg-white/20 px-2 py-0.5 rounded-lg mr-1.5",
                          isKid ? "text-sm" : "text-xs"
                        )}>Đồng nghĩa</span>
                        {synonyms.join(", ")}
                      </div>
                    )}

                    {antonyms.length > 0 && (
                      <div className={cn("max-w-[90%]", isKid ? "text-lg" : "text-sm")}>
                        <span className={cn(
                          "font-bold bg-white/20 px-2 py-0.5 rounded-lg mr-1.5",
                          isKid ? "text-sm" : "text-xs"
                        )}>Trái nghĩa</span>
                        {antonyms.join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Controls ── */}
            <div className="flex justify-center gap-4 mt-2">
              <Button
                onClick={prevCard}
                className={cn(isKid ? "kid-btn bg-brand hover:bg-brand-dark text-white" : "")}
                variant={isKid ? undefined : "brand"} size={isKid ? undefined : "pill"}
              >
                <ChevronLeft className={isKid ? "w-6 h-6" : "w-5 h-5"} />
                {isKid ? "◀ Trước" : "Trước"}
              </Button>
              <Button
                onClick={nextCard}
                className={cn(isKid ? "kid-btn bg-brand hover:bg-brand-dark text-white" : "")}
                variant={isKid ? undefined : "brand"} size={isKid ? undefined : "pill"}
              >
                {isKid ? "Tiếp ▶" : "Tiếp"}
                <ChevronRight className={isKid ? "w-6 h-6" : "w-5 h-5"} />
              </Button>
            </div>

            {/* Counter */}
            <div className={cn(
              "text-center font-semibold mt-4",
              isKid ? "kid-counter" : "text-lg text-[#495057]"
            )}>
              {isKid ? `🃏 Thẻ ${currentIndex + 1} / ${vocabulary.length}` : `Thẻ ${currentIndex + 1} / ${vocabulary.length}`}
            </div>

            {/* Jump */}
            <div className="flex items-center justify-center gap-2.5 mt-3 flex-wrap">
              <label className={cn(
                "font-semibold",
                isKid ? "text-purple-600 text-base" : "text-[#495057] text-sm"
              )}>
                {isKid ? "🔢 Đến thẻ số:" : "Đi đến thẻ:"}
              </label>
              <input
                type="number" min={1} max={vocabulary.length}
                value={jumpValue} placeholder="..."
                onChange={e => setJumpValue(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") jumpToCard(); }}
                className={cn(
                  "px-3 py-2 border-2 rounded-xl font-bold text-center outline-none",
                  isKid
                    ? "w-20 text-lg border-purple-400 text-purple-600 focus:ring-2 focus:ring-purple-300"
                    : "w-16 text-sm border-brand text-brand focus:ring-2 focus:ring-brand/30"
                )}
              />
              <Button
                onClick={jumpToCard}
                className={cn(isKid ? "kid-btn bg-brand hover:bg-brand-dark text-white h-auto py-2 px-6" : "")}
                variant={isKid ? undefined : "brand"} size={isKid ? undefined : "sm"}
              >
                Đi
              </Button>
            </div>

            <div className={cn(
              "text-center mt-2",
              isKid ? "kid-hint" : "text-muted-foreground text-sm"
            )}>
              {isKid ? "✨ Chạm vào thẻ để lật!" : "💡 Nhấn vào thẻ để lật"}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-4 px-4 text-[#adb5bd] text-xs border-t-2 border-[#f0e0e7] bg-white/80">
          © Bản quyền thuộc về <strong className="text-[#1a1a2e]">Huy Tutor</strong>
          &nbsp;|&nbsp;
          <a href="https://www.huytutor.io.vn/" target="_blank" rel="noreferrer"
            className="text-brand font-semibold hover:underline">
            www.huytutor.io.vn
          </a>
        </footer>
      </div>

      {/* ── RIGHT SIDEBAR ── */}
      <aside className={cn(
        "hidden md:flex flex-col bg-white border-l-2 border-[#f0e0e7] flex-shrink-0",
        "sticky top-0 h-[calc(100vh-62px)] overflow-hidden transition-all duration-300",
        rightCollapsed ? "w-10" : "w-[280px]"
      )}>
        <div className="flex items-center gap-2 p-4 border-b-2 border-[#f0e0e7] flex-shrink-0">
          <button onClick={() => setRightCollapsed(v => !v)}
            className="cursor-pointer text-brand text-xl p-1 rounded-lg hover:bg-brand-light flex-shrink-0">
            {rightCollapsed ? "◀" : "▶"}
          </button>
          {!rightCollapsed && (
            <span className={cn("font-extrabold whitespace-nowrap",
              isKid ? "text-purple-600 text-base" : "text-brand text-[1.05em]")}>
              {isKid ? "📝 Từ trong bài" : "📋 Danh sách từ"}
            </span>
          )}
        </div>

        {!rightCollapsed && (
          <div className="overflow-y-auto flex-1 p-3">
            {vocabulary.map((v, i) => (
              <div key={i}
                onClick={() => { setIsFlipped(false); setTimeout(() => setCurrentIndex(i), 50); }}
                className={cn(
                  "p-2.5 rounded-xl cursor-pointer transition-all border-2 flex items-center gap-2.5 mb-2",
                  isKid ? "kid-word-item" : "",
                  i === currentIndex
                    ? cn("border-brand", isKid ? "kid-word-item active" : "bg-brand text-white")
                    : "bg-[#f8f9fa] border-transparent"
                )}>
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0",
                  i === currentIndex
                    ? isKid ? "bg-white text-purple-600 shadow" : "bg-white text-brand"
                    : isKid ? "bg-purple-100 text-purple-600" : "bg-brand text-white"
                )}>{i + 1}</div>
                <span className={cn(
                  "font-semibold flex-1 truncate",
                  isKid ? "text-base" : "text-sm",
                  i === currentIndex && !isKid ? "text-white" : ""
                )}>{v.word}</span>
                {v.cefr && (
                  <span className={cn(
                    "font-bold flex-shrink-0 px-1.5 py-0.5 rounded",
                    isKid ? "text-xs" : "text-[0.7rem]",
                    i === currentIndex && !isKid ? "bg-white/20 text-white" : getCefrColor(v.cefr)
                  )}>{v.cefr}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </aside>
      </div>{/* end desktop 3-col */}

      {/* ══ MOBILE: word list at bottom (< md) ══════════════════════════════ */}
      <details className="md:hidden bg-white border-t-2 border-[#f0e0e7]">
        <summary className={cn(
          "flex items-center gap-2 px-4 py-3 cursor-pointer font-extrabold select-none list-none",
          isKid ? "text-purple-600 text-base" : "text-brand text-sm"
        )}>
          <span>{isKid ? "📝 Từ trong bài" : "📋 Danh sách từ"}</span>
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            {currentIndex + 1} / {vocabulary.length}
          </span>
          <span className="text-brand text-xs">▼</span>
        </summary>
        <div className="border-t border-[#f0e0e7] max-h-52 overflow-y-auto divide-y divide-[#f0e0e7]">
          {vocabulary.map((v, i) => (
            <button key={i}
              onClick={() => { setIsFlipped(false); setTimeout(() => setCurrentIndex(i), 50); }}
              className={cn(
                "flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm font-semibold transition-colors",
                i === currentIndex
                  ? isKid ? "bg-purple-50 text-purple-600" : "bg-brand-light text-brand"
                  : "hover:bg-gray-50 text-[#495057]"
              )}>
              <span className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                i === currentIndex
                  ? isKid ? "bg-purple-200 text-purple-700" : "bg-brand text-white"
                  : "bg-gray-200 text-gray-600"
              )}>{i + 1}</span>
              <span className="flex-1 truncate">{v.word}</span>
              {v.cefr && (
                <span className={cn(
                  "text-[0.65rem] font-bold px-1.5 py-0.5 rounded flex-shrink-0",
                  i === currentIndex && !isKid ? "bg-brand text-white" : getCefrColor(v.cefr)
                )}>{v.cefr}</span>
              )}
            </button>
          ))}
        </div>
      </details>

    </div>
  );
}
