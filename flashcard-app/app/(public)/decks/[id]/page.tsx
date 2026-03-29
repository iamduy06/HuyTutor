import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/services/supabase/admin";
import { extractTabs } from "@/lib/utils";
import { DEMO_LIMIT, FACEBOOK_URL } from "@/lib/constants";
import type { FlashcardRow, Tab } from "@/types";
import { FlashcardPlayer } from "@/components/flashcard/FlashcardPlayer";
import { Button } from "@/components/ui/button";

interface Props { params: { id: string } }

export default async function DeckDemoPage({ params }: Props) {
  const supabase = createAdminClient();

  const { data: deck } = await supabase
    .from("decks")
    .select("id, title, description, level")
    .eq("id", params.id)
    .single();
  if (!deck) notFound();

  const { data: rows } = await supabase
    .from("flashcards")
    .select("id, deck_id, content, created_at")
    .eq("deck_id", params.id)
    .order("created_at", { ascending: true });

  const allTabs: Tab[] = (rows ?? []).flatMap(r =>
    extractTabs((r as unknown as FlashcardRow).content)
  );

  // Giới hạn demo
  let seen = 0;
  const demoTabs = allTabs.map(tab => {
    const remaining = DEMO_LIMIT - seen;
    if (remaining <= 0) return null;
    const vocab = (tab.vocabulary ?? []).slice(0, remaining);
    seen += vocab.length;
    return { ...tab, vocabulary: vocab };
  }).filter((t): t is Tab => t !== null && t.vocabulary.length > 0);

  return (
    <div className="flex flex-col flex-1">
      {/* Demo banner */}
      <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2.5 text-center text-sm text-yellow-800 flex items-center justify-center gap-3 flex-wrap">
        <span>🎯 Bản demo — tối đa {DEMO_LIMIT} từ.</span>
        <Button variant="brand" size="sm" asChild className="rounded-full h-7 text-xs px-3">
          <Link href="/login">Đăng nhập để học đầy đủ</Link>
        </Button>
        <Button variant="outline" size="sm" asChild className="rounded-full h-7 text-xs px-3">
          <Link href={FACEBOOK_URL} target="_blank">💬 Mua bộ đề</Link>
        </Button>
      </div>
      <FlashcardPlayer
        tabs={demoTabs}
        deckTitle={deck.title}
        deckDesc={deck.description ?? undefined}
        isDemo
      />
    </div>
  );
}
