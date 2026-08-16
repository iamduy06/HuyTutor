"use client";

import { ChevronDown } from "lucide-react";

interface DeckOption {
  deck_id: string;
  title: string;
  wordCount?: number;
}

interface DeckSelectorProps {
  decks: DeckOption[];
  value: string | null;       // null = "all"
  onChange: (deckId: string | null) => void;
  disabled?: boolean;
}

export function DeckSelector({ decks, value, onChange, disabled }: DeckSelectorProps) {
  return (
    <div className="relative inline-block">
      <select
        disabled={disabled}
        value={value ?? "all"}
        onChange={e => onChange(e.target.value === "all" ? null : e.target.value)}
        className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border-2 border-[#f0e0e7] bg-white
                   font-semibold text-sm text-[#1a1a2e] cursor-pointer outline-none
                   focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all
                   disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
      >
        <option value="all">🗂️ Tất cả deck</option>
        {decks.map(d => (
          <option key={d.deck_id} value={d.deck_id}>
            {d.title}{d.wordCount ? ` (${d.wordCount} từ)` : ""}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
    </div>
  );
}
