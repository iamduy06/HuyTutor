"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Check, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameShell } from "@/components/game/GameShell";
import { useGameStore } from "@/features/game/store";
import { useGameVocab } from "@/features/game/useGameVocab";
import { shuffle, pickPairs } from "@/features/game/gameUtils";
import type { VocabItem } from "@/types";

interface DeckOption { deck_id: string; title: string; wordCount?: number; }

type ConnMap = Map<string, string>; // leftWordKey → rightItemId
type SelState = { id: string; side: "left" | "right" } | null;

interface LineCoord {
  leftKey: string; rightId: string;
  x1: number; y1: number; x2: number; y2: number;
  correct?: boolean;
}

function MatchingInner({ vocab }: { vocab: VocabItem[] }) {
  const { pairCount, setPairCount, isStarted, isFinished, startGame, finishGame, resetGame } = useGameStore();
  const [round, setRound]       = useState(0);
  const [pairs, setPairs]       = useState<VocabItem[]>([]);
  const [rightItems, setRight]  = useState<{ id: string; meaning: string; wordKey: string }[]>([]);
  const [connections, setConns] = useState<ConnMap>(new Map());
  const [selected, setSelected] = useState<SelState>(null);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults]   = useState<Map<string, boolean>>(new Map());
  const [score, setScore]       = useState(0);
  const [total, setTotal]       = useState(0);
  const [lines, setLines]       = useState<LineCoord[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const leftRefs  = useRef<Map<string, HTMLButtonElement>>(new Map());
  const rightRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const maxPairs = Math.min(20, vocab.length);

  // Tính toán lại SVG lines mỗi khi connections thay đổi
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const cr = container.getBoundingClientRect();
    const coords: LineCoord[] = [];
    Array.from(connections.entries()).forEach(([leftKey, rightId]) => {
      const lEl = leftRefs.current.get(leftKey);
      const rEl = rightRefs.current.get(rightId);
      if (!lEl || !rEl) return;
      const lr = lEl.getBoundingClientRect();
      const rr = rEl.getBoundingClientRect();
      coords.push({
        leftKey, rightId,
        x1: lr.right  - cr.left,
        y1: lr.top + lr.height / 2 - cr.top,
        x2: rr.left   - cr.left,
        y2: rr.top + rr.height / 2 - cr.top,
        correct: submitted ? results.get(leftKey) : undefined,
      });
    });
    setLines(coords);
  }, [connections, submitted, results]);

  function startRound(pairsArr: VocabItem[]) {
    const right = shuffle(pairsArr.map(v => ({ id: `r-${v.word}`, meaning: v.meaning, wordKey: v.word })));
    setPairs(pairsArr); setRight(right);
    setConns(new Map()); setSelected(null);
    setSubmitted(false); setResults(new Map()); setLines([]);
  }

  function handleStart() {
    setScore(0); setTotal(0);
    startGame([]); // just to toggle isStarted
    startRound(pickPairs(vocab, pairCount));
  }

  useEffect(() => {
    if (isStarted && pairs.length === 0) {
      handleStart();
    }
  }, [isStarted]);

  function connect(leftKey: string, rightId: string) {
    const m = new Map(connections);
    // Bỏ nối cũ nếu rightId đã có chủ
    Array.from(m.entries()).forEach(([k, v]) => { if (v === rightId) m.delete(k); });
    m.set(leftKey, rightId);
    setConns(m); setSelected(null);
  }

  function handleClickLeft(wordKey: string) {
    if (submitted) return;
    if (!selected) { setSelected({ id: wordKey, side: "left" }); return; }
    if (selected.side === "left") {
      setSelected(selected.id === wordKey ? null : { id: wordKey, side: "left" });
    } else {
      connect(wordKey, selected.id); // right đã chọn → nối
    }
  }

  function handleClickRight(itemId: string) {
    if (submitted) return;
    if (!selected) { setSelected({ id: itemId, side: "right" }); return; }
    if (selected.side === "right") {
      setSelected(selected.id === itemId ? null : { id: itemId, side: "right" });
    } else {
      connect(selected.id, itemId); // left đã chọn → nối
    }
  }

  function handleSubmit() {
    const res = new Map<string, boolean>();
    let correct = 0;
    pairs.forEach(v => {
      const ok = rightItems.find(r => r.id === connections.get(v.word))?.wordKey === v.word;
      res.set(v.word, ok); if (ok) correct++;
    });
    setResults(res); setSubmitted(true);
    setScore(s => s + correct); setTotal(t => t + pairs.length);
  }

  function handleNext() {
    const rem = vocab.filter(v => !pairs.some(p => p.word === v.word));
    if (rem.length < 2) { finishGame(); return; }
    setRound(r => r + 1);
    startRound(pickPairs(rem.length >= pairCount ? rem : vocab, pairCount));
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
        <div className="text-5xl">🔗</div>
        <h2 className="font-extrabold text-[#1a1a2e] text-xl">Nối Từ</h2>
        <p className="text-muted-foreground text-sm max-w-sm">
          Click vào từ hoặc nghĩa bất kỳ để chọn, rồi click vào phần tương ứng để nối.
        </p>
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-muted-foreground">Số cặp:</label>
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

  const connRights = new Set(Array.from(connections.values()));

  // Màu đường nối
  const lineColor = (correct?: boolean) =>
    correct === true ? "#16a34a" : correct === false ? "#dc2626" : "#e91e8c";

  return (
    <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between text-sm font-semibold text-muted-foreground">
        <span>Vòng {round + 1}</span>
        <span className="text-brand">{connections.size} / {pairs.length} đã nối</span>
      </div>

      {!submitted && (
        <p className="text-xs text-muted-foreground text-center">
          {selected
            ? selected.side === "left"
              ? `✅ Đã chọn "${selected.id}" — click nghĩa bên phải`
              : `✅ Đã chọn nghĩa — click từ bên trái`
            : "Click bất kỳ từ hoặc nghĩa để bắt đầu nối"}
        </p>
      )}

      {/* Container chứa 2 cột + SVG overlay */}
      <div ref={containerRef} className="relative select-none">
        <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 64px 1fr" }}>

          {/* CỘT TRÁI */}
          <div className="flex flex-col gap-2">
            <div className="text-[11px] font-bold text-center text-muted-foreground uppercase tracking-widest mb-1">Tiếng Anh</div>
            {pairs.map(v => {
              const isSel    = selected?.side === "left" && selected.id === v.word;
              const isConn   = connections.has(v.word);
              const result   = results.get(v.word);
              return (
                <button
                  key={v.word}
                  ref={el => { el ? leftRefs.current.set(v.word, el) : leftRefs.current.delete(v.word); }}
                  onClick={() => handleClickLeft(v.word)}
                  disabled={submitted}
                  className={cn(
                    "px-3 py-3 rounded-xl border-2 font-semibold text-sm text-left w-full transition-all",
                    submitted && result === true  && "border-green-400 bg-green-50 text-green-800",
                    submitted && result === false && "border-red-400 bg-red-50 text-red-800",
                    !submitted && isSel   && "border-brand bg-brand-light text-brand shadow-lg ring-2 ring-brand/30 scale-[1.02]",
                    !submitted && !isSel && isConn  && "border-brand/40 bg-brand-light/40",
                    !submitted && !isSel && !isConn && "border-[#f0e0e7] hover:border-brand hover:bg-brand-light cursor-pointer",
                    submitted && "cursor-default"
                  )}
                >
                  {v.word}
                  {submitted && (
                    <span className="float-right mt-0.5">
                      {result ? <Check className="w-4 h-4 text-green-600 inline" /> : <X className="w-4 h-4 text-red-600 inline" />}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* GIỮA — khoảng trống cho SVG */}
          <div />

          {/* CỘT PHẢI */}
          <div className="flex flex-col gap-2">
            <div className="text-[11px] font-bold text-center text-muted-foreground uppercase tracking-widest mb-1">Nghĩa</div>
            {rightItems.map(item => {
              const isSel  = selected?.side === "right" && selected.id === item.id;
              const isConn = connRights.has(item.id);
              const leftKey = Array.from(connections.entries()).find(([, v]) => v === item.id)?.[0];
              const result  = leftKey ? results.get(leftKey) : undefined;
              return (
                <button
                  key={item.id}
                  ref={el => { el ? rightRefs.current.set(item.id, el) : rightRefs.current.delete(item.id); }}
                  onClick={() => handleClickRight(item.id)}
                  disabled={submitted}
                  className={cn(
                    "px-3 py-3 rounded-xl border-2 font-semibold text-sm text-left w-full transition-all",
                    submitted && result === true  && "border-green-400 bg-green-50 text-green-800",
                    submitted && result === false && "border-red-400 bg-red-50 text-red-800",
                    !submitted && isSel   && "border-brand bg-brand-light text-brand shadow-lg ring-2 ring-brand/30 scale-[1.02]",
                    !submitted && !isSel && isConn  && "border-brand/40 bg-brand-light/40",
                    !submitted && !isSel && !isConn && "border-[#f0e0e7] hover:border-brand hover:bg-brand-light cursor-pointer",
                    submitted && "cursor-default"
                  )}
                >
                  {item.meaning}
                  {submitted && result === false && (
                    <div className="text-xs text-green-700 font-normal mt-0.5">
                      ✓ {pairs.find(p => p.word === item.wordKey)?.word}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* SVG lines overlay */}
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ width: "100%", height: "100%", overflow: "visible" }}
        >
          {lines.map(l => {
            const color = lineColor(l.correct);
            const mid   = (l.x1 + l.x2) / 2;
            return (
              <g key={`${l.leftKey}-${l.rightId}`}>
                <path
                  d={`M ${l.x1} ${l.y1} C ${mid} ${l.y1}, ${mid} ${l.y2}, ${l.x2} ${l.y2}`}
                  stroke={color} strokeWidth={2.5} fill="none"
                  strokeDasharray={l.correct === undefined ? "7 4" : undefined}
                  opacity={0.9}
                />
                <circle cx={l.x1} cy={l.y1} r={5} fill={color} />
                <circle cx={l.x2} cy={l.y2} r={5} fill={color} />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {!submitted ? (
          <Button variant="brand" className="flex-1" onClick={handleSubmit}
            disabled={connections.size < pairs.length}>
            {connections.size < pairs.length
              ? `Còn ${pairs.length - connections.size} cặp chưa nối`
              : "✅ Xác nhận"}
          </Button>
        ) : (
          <Button variant="brand" className="flex-1 gap-2" onClick={handleNext}>
            Vòng tiếp theo →
          </Button>
        )}
      </div>
    </div>
  );
}

export function MatchingGame({ userDecks }: { userDecks: DeckOption[] }) {
  const { selectedDeckId, startGame, resetGame } = useGameStore();
  const { data } = useGameVocab(selectedDeckId === undefined ? null : selectedDeckId);
  const [replayKey, setReplayKey] = useState(0);

  const handleReplay = () => {
    resetGame();
    startGame([]); 
    setReplayKey(k => k + 1); 
  };

  return (
    <GameShell title="Nối Từ" icon="🔗" minWords={2}
      minWordsMessage="Cần ít nhất 2 từ để chơi Nối Từ."
      userDecks={userDecks} showProgress={false}
      onReplay={handleReplay}
    >
      {data && <MatchingInner key={replayKey} vocab={data.vocab} />}
    </GameShell>
  );
}
