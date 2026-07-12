"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Check, X, RotateCcw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameShell } from "@/components/game/GameShell";
import { useGameStore } from "@/features/game/store";
import { useGameVocab } from "@/features/game/useGameVocab";
import {
  pickPairs, buildSynAntRightItems, filterVocabWithSynAnt, type SynAntRightItem,
} from "@/features/game/gameUtils";
import type { VocabItem } from "@/types";

interface DeckOption { deck_id: string; title: string; wordCount?: number; }

// leftWord → Set<rightItemId>  (one-to-many)
type SynAntConns = Map<string, Set<string>>;
type SelState = { id: string; side: "left" | "right" } | null;

interface LineCoord {
  leftWord: string; rightId: string;
  x1: number; y1: number; x2: number; y2: number;
  correct?: boolean;
}

function SynAntInner({ vocab }: { vocab: VocabItem[] }) {
  const { pairCount, setPairCount, isStarted, isFinished, startGame, finishGame, resetGame } = useGameStore();
  const eligible = filterVocabWithSynAnt(vocab);

  const [pairs, setPairs]       = useState<VocabItem[]>([]);
  const [rightItems, setRight]  = useState<SynAntRightItem[]>([]);
  const [connections, setConns] = useState<SynAntConns>(new Map());
  const [selected, setSelected] = useState<SelState>(null);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults]   = useState<Map<string, boolean>>(new Map()); // rightItemId → correct
  const [score, setScore]       = useState(0);
  const [total, setTotal]       = useState(0);
  const [lines, setLines]       = useState<LineCoord[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const leftRefs  = useRef<Map<string, HTMLButtonElement>>(new Map());
  const rightRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const maxPairs = Math.min(20, eligible.length);

  // Tính SVG lines
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const cr = container.getBoundingClientRect();
    const coords: LineCoord[] = [];
    Array.from(connections.entries()).forEach(([leftWord, rightSet]) => {
      Array.from(rightSet).forEach(rightId => {
        const lEl = leftRefs.current.get(leftWord);
        const rEl = rightRefs.current.get(rightId);
        if (!lEl || !rEl) return;
        const lr = lEl.getBoundingClientRect();
        const rr = rEl.getBoundingClientRect();
        coords.push({
          leftWord, rightId,
          x1: lr.right - cr.left,
          y1: lr.top + lr.height / 2 - cr.top,
          x2: rr.left - cr.left,
          y2: rr.top + rr.height / 2 - cr.top,
          correct: submitted ? results.get(rightId) : undefined,
        });
      });
    });
    setLines(coords);
  }, [connections, submitted, results]);

  function startRound(pairsArr: VocabItem[]) {
    setPairs(pairsArr); setRight(buildSynAntRightItems(pairsArr));
    setConns(new Map()); setSelected(null);
    setSubmitted(false); setResults(new Map()); setLines([]);
  }

  function handleStart() {
    setScore(0); setTotal(0); 
    startGame([]); // just to toggle isStarted
    startRound(pickPairs(eligible, Math.min(pairCount, eligible.length)));
  }

  useEffect(() => {
    if (isStarted && pairs.length === 0) {
      handleStart();
    }
  }, [isStarted]);

  // Toggle nối: leftWord ↔ rightId
  function toggleConnect(leftWord: string, rightId: string) {
    const m = new Map(connections);
    const s = new Set(m.get(leftWord) ?? []);
    s.has(rightId) ? s.delete(rightId) : s.add(rightId);
    m.set(leftWord, s);
    setConns(m); setSelected(null);
  }

  function handleClickLeft(word: string) {
    if (submitted) return;
    if (!selected) { setSelected({ id: word, side: "left" }); return; }
    if (selected.side === "left") {
      setSelected(selected.id === word ? null : { id: word, side: "left" });
    } else {
      toggleConnect(word, selected.id);
    }
  }

  function handleClickRight(itemId: string) {
    if (submitted) return;
    if (!selected) { setSelected({ id: itemId, side: "right" }); return; }
    if (selected.side === "right") {
      setSelected(selected.id === itemId ? null : { id: itemId, side: "right" });
    } else {
      toggleConnect(selected.id, itemId);
    }
  }

  function handleSubmit() {
    const res = new Map<string, boolean>();
    let correctCount = 0, totalCount = 0;

    rightItems.forEach(item => {
      const connectedByAny = Array.from(connections.values()).some(s => s.has(item.id));
      if (!connectedByAny) return;
      totalCount++;

      let ok = false;
      Array.from(connections.entries()).forEach(([leftWord, rightSet]) => {
        if (rightSet.has(item.id) && item.belongsToWordIds.includes(leftWord)) ok = true;
      });
      let wrong = false;
      Array.from(connections.entries()).forEach(([leftWord, rightSet]) => {
        if (rightSet.has(item.id) && !item.belongsToWordIds.includes(leftWord)) wrong = true;
      });

      const isCorrect = ok && !wrong;
      res.set(item.id, isCorrect);
      if (isCorrect) correctCount++;
    });

    setResults(res); setSubmitted(true);
    setScore(s => s + correctCount); setTotal(t => t + totalCount);
  }

  if (eligible.length < 2) {
    return (
      <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-8 text-center flex flex-col gap-3">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <p className="font-bold text-amber-800">Deck không đủ từ có đồng/trái nghĩa.</p>
        <p className="text-sm text-amber-700">Cần ít nhất 2 từ có trường synonyms hoặc antonyms.</p>
      </div>
    );
  }

  if (isFinished) {
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    return (
      <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-8 flex flex-col gap-4 items-center text-center">
        <div className="text-5xl">{pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "💪"}</div>
        <p className="text-2xl font-extrabold text-brand">{score} / {total} ({pct}%)</p>
        <div className="flex gap-3 mt-2">
          <Button variant="brand" onClick={handleStart} className="gap-2">
            <RotateCcw className="w-4 h-4" /> Chơi lại
          </Button>
          <Button variant="outline" onClick={() => resetGame()} className="gap-2">
            Chọn lại Decks/Tabs
          </Button>
        </div>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-8 flex flex-col gap-5 items-center text-center">
        <div className="text-5xl">↔️</div>
        <h2 className="font-extrabold text-[#1a1a2e] text-xl">Đồng / Trái Nghĩa</h2>
        <p className="text-muted-foreground text-sm max-w-sm">
          Click vào từ hoặc đồng/trái nghĩa bất kỳ để chọn, rồi click phần tương ứng để nối.
          Một từ có thể nối nhiều đáp án.
        </p>
        <p className="text-xs text-brand font-semibold">{eligible.length} từ có syn/ant trong deck này</p>
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-muted-foreground">Số từ (trái):</label>
          <input type="number" min={2} max={maxPairs} value={pairCount}
            onChange={e => setPairCount(Number(e.target.value))}
            className="w-20 text-center border-2 border-[#f0e0e7] rounded-xl px-3 py-2 font-bold text-brand focus:border-brand outline-none"
          />
          <span className="text-xs text-muted-foreground">(tối đa {maxPairs})</span>
        </div>
        <Button variant="brand" size="lg" onClick={handleStart} className="gap-2 mt-2">🎮 Bắt đầu</Button>
      </div>
    );
  }

  const totalConns = Array.from(connections.values()).reduce((s, set) => s + set.size, 0);
  const lineColor = (correct?: boolean) =>
    correct === true ? "#16a34a" : correct === false ? "#dc2626" : "#e91e8c";

  return (
    <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-6 flex flex-col gap-5">
      <div className="flex justify-between text-sm font-semibold text-muted-foreground">
        <span>Đã nối: {totalConns} cặp</span>
        {selected && (
          <span className="text-brand">
            {selected.side === "left" ? `Đang chọn: ${selected.id}` : "Đã chọn đồng/trái nghĩa"}
          </span>
        )}
      </div>

      {!submitted && (
        <p className="text-xs text-muted-foreground text-center">
          Click từ hoặc đồng/trái nghĩa bất kỳ để chọn rồi nối. Có thể nối nhiều lần mỗi từ.
        </p>
      )}

      {/* Hai cột + SVG */}
      <div ref={containerRef} className="relative select-none">
        <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 64px 1fr" }}>

          {/* CỘT TRÁI */}
          <div className="flex flex-col gap-2">
            <div className="text-[11px] font-bold text-center text-muted-foreground uppercase tracking-widest mb-1">Từ gốc</div>
            {pairs.map(v => {
              const isSel   = selected?.side === "left" && selected.id === v.word;
              const connCnt = connections.get(v.word)?.size ?? 0;
              return (
                <button key={v.word}
                  ref={el => { el ? leftRefs.current.set(v.word, el) : leftRefs.current.delete(v.word); }}
                  onClick={() => handleClickLeft(v.word)} disabled={submitted}
                  className={cn(
                    "px-3 py-3 rounded-xl border-2 font-semibold text-sm text-left w-full transition-all",
                    !submitted && isSel   && "border-brand bg-brand-light text-brand shadow-lg ring-2 ring-brand/30 scale-[1.02]",
                    !submitted && !isSel && connCnt > 0 && "border-brand/40 bg-brand-light/40",
                    !submitted && !isSel && connCnt === 0 && "border-[#f0e0e7] hover:border-brand hover:bg-brand-light cursor-pointer",
                    submitted && "border-[#f0e0e7] cursor-default"
                  )}
                >
                  {v.word}
                  {connCnt > 0 && !submitted && (
                    <span className="ml-2 text-[10px] bg-brand text-white rounded-full px-1.5 py-0.5 font-bold">{connCnt}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* GIỮA */}
          <div />

          {/* CỘT PHẢI */}
          <div className="flex flex-col gap-2">
            <div className="text-[11px] font-bold text-center text-muted-foreground uppercase tracking-widest mb-1">Đồng / Trái nghĩa</div>
            {rightItems.map(item => {
              const isSel      = selected?.side === "right" && selected.id === item.id;
              const isConnByAny = Array.from(connections.values()).some(s => s.has(item.id));
              const isConnBySel = selected?.side === "left" ? (connections.get(selected.id)?.has(item.id) ?? false) : false;
              const result      = results.get(item.id);
              return (
                <button key={item.id}
                  ref={el => { el ? rightRefs.current.set(item.id, el) : rightRefs.current.delete(item.id); }}
                  onClick={() => handleClickRight(item.id)}
                  disabled={submitted || (!selected && !isConnByAny)}
                  className={cn(
                    "px-3 py-3 rounded-xl border-2 text-sm text-left w-full transition-all",
                    submitted && result === true  && "border-green-400 bg-green-50 text-green-800 font-semibold",
                    submitted && result === false && "border-red-400 bg-red-50 text-red-800 font-semibold",
                    submitted && result === undefined && "border-[#f0e0e7] opacity-50 cursor-default",
                    !submitted && isSel       && "border-brand bg-brand-light text-brand shadow-lg ring-2 ring-brand/30 scale-[1.02] font-semibold",
                    !submitted && !isSel && isConnBySel && "border-brand bg-brand-light text-brand font-semibold",
                    !submitted && !isSel && !isConnBySel && isConnByAny && "border-brand/30 bg-brand-light/30 font-medium",
                    !submitted && !isSel && !isConnByAny && selected && "border-[#f0e0e7] hover:border-brand hover:bg-brand-light cursor-pointer",
                    !submitted && !isSel && !isConnByAny && !selected && "border-[#f0e0e7] cursor-pointer opacity-80",
                  )}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>{item.text}</span>
                    <span className={cn(
                      "text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0",
                      item.type === "synonym" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                    )}>
                      {item.type === "synonym" ? "ĐN" : "TN"}
                    </span>
                  </div>
                  {submitted && result !== undefined && (
                    <div className="mt-1 flex items-center gap-1 text-xs">
                      {result
                        ? <><Check className="w-3 h-3 text-green-600" /> <span className="text-green-700">Chính xác</span></>
                        : <><X className="w-3 h-3 text-red-600" /> <span className="text-red-700">Sai</span></>}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* SVG overlay */}
        <svg className="absolute inset-0 pointer-events-none" style={{ width: "100%", height: "100%", overflow: "visible" }}>
          {lines.map(l => {
            const color = lineColor(l.correct);
            const mid = (l.x1 + l.x2) / 2;
            return (
              <g key={`${l.leftWord}-${l.rightId}`}>
                <path
                  d={`M ${l.x1} ${l.y1} C ${mid} ${l.y1}, ${mid} ${l.y2}, ${l.x2} ${l.y2}`}
                  stroke={color} strokeWidth={2.5} fill="none"
                  strokeDasharray={l.correct === undefined ? "7 4" : undefined}
                  opacity={0.85}
                />
                <circle cx={l.x1} cy={l.y1} r={4.5} fill={color} />
                <circle cx={l.x2} cy={l.y2} r={4.5} fill={color} />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex gap-3">
        {!submitted ? (
          <Button variant="brand" className="flex-1" onClick={handleSubmit} disabled={totalConns === 0}>
            {totalConns === 0 ? "Hãy nối ít nhất 1 cặp" : "✅ Xác nhận"}
          </Button>
        ) : (
          <Button variant="brand" className="flex-1 gap-2" onClick={() => finishGame()}>
            Xem kết quả →
          </Button>
        )}
      </div>
    </div>
  );
}

export function SynAntGame({ userDecks }: { userDecks: DeckOption[] }) {
  const { selectedDeckId, startGame, resetGame } = useGameStore();
  const { data } = useGameVocab(selectedDeckId === undefined ? null : selectedDeckId);
  const [replayKey, setReplayKey] = useState(0);

  const handleReplay = () => {
    resetGame();
    startGame([]); // Toggle isStarted to true so SynAntInner auto-starts
    setReplayKey(k => k + 1); // Remount SynAntInner to reset its local states completely
  };

  return (
    <GameShell title="Đồng / Trái Nghĩa" icon="↔️" minWords={2}
      minWordsMessage="Cần ít nhất 2 từ có synonyms/antonyms."
      userDecks={userDecks} showProgress={false}
      onReplay={handleReplay}
    >
      {data && <SynAntInner key={replayKey} vocab={data.vocab} />}
    </GameShell>
  );
}
