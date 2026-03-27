import Link from "next/link";
import { Deck } from "@/types";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ChevronRight } from "lucide-react";
import { cefrColor } from "@/lib/utils";

interface DeckCardProps {
  deck: Deck;
  href: string;
  actionLabel?: string;
}

export function DeckCard({ deck, href, actionLabel = "Học thử" }: DeckCardProps) {
  return (
    <Link
      href={href}
      className="group block bg-white rounded-2xl border-2 border-border p-5 hover:border-brand-red hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-brand-red-light rounded-xl flex items-center justify-center group-hover:bg-brand-red transition-colors">
          <BookOpen className="h-5 w-5 text-brand-red group-hover:text-white transition-colors" />
        </div>
        {deck.level && (
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cefrColor(deck.level)}`}>
            {deck.level}
          </span>
        )}
      </div>

      <h3 className="font-bold text-gray-900 text-base mb-1 group-hover:text-brand-red transition-colors line-clamp-2">
        {deck.title}
      </h3>

      {deck.description && (
        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{deck.description}</p>
      )}

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
        <span className="text-xs text-muted-foreground font-medium">
          📝 {deck.word_count ?? 0} từ
        </span>
        <span className="text-brand-red text-xs font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
          {actionLabel} <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
