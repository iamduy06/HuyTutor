import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { cn, getCefrColor } from "@/lib/utils";
import type { Deck } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DeckCardProps {
  deck: Deck;
  href: string;
  ctaLabel?: string;
  showProgress?: boolean;
  progressPercent?: number;
  showPublicBadge?: boolean;  // chỉ hiện ở admin context
}

export function DeckCard({ deck, href, ctaLabel = "Học thử", showProgress, progressPercent, showPublicBadge = false }: DeckCardProps) {
  return (
    <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-5 flex flex-col gap-3 hover:border-brand hover:shadow-lg transition-all group">
      <div className="flex items-start justify-between gap-2">
        <div className="w-11 h-11 rounded-xl bg-brand-light flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-5 h-5 text-brand" />
        </div>
        <div className="flex flex-col items-end gap-1">
          {deck.level && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-light text-brand border border-brand-mid">
              {deck.level}
            </span>
          )}
          {showPublicBadge && (
            deck.is_public
              ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">🌐 Public</span>
              : <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">🔒 Private</span>
          )}
        </div>
      </div>

      <div className="flex-1">
        <h3 className="font-extrabold text-[#1a1a2e] text-lg leading-snug mb-1 group-hover:text-brand transition-colors" title={deck.title}>
          {deck.title}
        </h3>
        {deck.description && (
          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">{deck.description}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">
          📝 {deck.word_count ?? deck.flashcard_count ?? 0} từ
        </span>
        {showProgress && progressPercent !== undefined && (
          <span className="text-xs font-semibold text-brand">{progressPercent}%</span>
        )}
      </div>

      {showProgress && progressPercent !== undefined && (
        <div className="h-1.5 bg-[#f0e0e7] rounded-full overflow-hidden">
          <div
            className="h-full bg-brand rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      <Button variant="brand-outline" size="sm" asChild className="w-full mt-1">
        <Link href={href}>
          {ctaLabel} <ChevronRight className="w-4 h-4" />
        </Link>
      </Button>
    </div>
  );
}
