"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Folder } from "lucide-react";
import { DeckCard } from "@/components/flashcard/DeckCard";
import { cn } from "@/lib/utils";
import type { Deck, DeckGroup } from "@/types";

interface GroupData {
  group: DeckGroup | null;
  decks: Deck[];
}

interface PublicGroupedDecksProps {
  groups: GroupData[];
}

export function PublicGroupedDecks({ groups }: PublicGroupedDecksProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    groups.forEach(g => {
      initial[g.group?.id || "none"] = true;
    });
    return initial;
  });

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (groups.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground bg-white rounded-3xl border-2 border-dashed border-[#f0e0e7] animate-in fade-in zoom-in duration-500">
        <div className="text-6xl mb-4">📭</div>
        <p className="text-xl font-medium">Chưa có Flashcard nào sẵn sàng.</p>
        <p className="text-sm mt-2 opacity-70">Hãy quay lại sau hoặc liên hệ hỗ trợ.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {groups.map(({ group, decks }) => {
        const id = group?.id || "none";
        const isExpanded = expandedGroups[id];

        return (
          <div key={id} className="group/section animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Group Header */}
            <div 
              className={cn(
                "flex items-center justify-between p-3.5 px-4 rounded-xl cursor-pointer transition-all border-2 mb-3 select-none shadow-sm",
                isExpanded 
                  ? "bg-white border-brand shadow-md" 
                  : "bg-[#f8f9fa] border-[#f0e0e7] hover:border-brand-mid"
              )}
              onClick={() => toggleGroup(id)}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                  isExpanded ? "bg-brand text-white shadow-lg shadow-brand/20" : "bg-white text-muted-foreground border border-[#f0e0e7]"
                )}>
                  <Folder className={cn("w-5 h-5", isExpanded && "fill-current/20")} />
                </div>
                <div>
                  <h2 className={cn(
                    "text-lg font-black transition-colors leading-tight",
                    isExpanded ? "text-[#1a1a2e]" : "text-[#495057]"
                  )}>
                    {group?.name || "Các bộ đề khác"}
                  </h2>
                  {group?.description && (
                    <p className="text-[13px] text-muted-foreground line-clamp-1 mt-0.5">{group.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                 <span className={cn(
                  "hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  isExpanded ? "bg-brand-light text-brand" : "bg-gray-200 text-gray-500"
                )}>
                  {decks.length} bộ đề
                </span>
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                  isExpanded ? "bg-brand text-white rotate-180" : "bg-gray-200 text-gray-500"
                )}>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>


            {/* Group Content */}
            {isExpanded && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                {decks.map(deck => (
                  <DeckCard 
                    key={deck.id} 
                    deck={deck} 
                    href={`/decks/${deck.id}`} 
                    ctaLabel="Học thử" 
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
