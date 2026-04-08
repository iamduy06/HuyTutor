import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/services/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { FACEBOOK_URL } from "@/lib/constants";
import { hasFullAccess, extractTabs } from "@/lib/utils";
import { FlashcardPlayer } from "@/components/flashcard/FlashcardPlayer";
import { Button } from "@/components/ui/button";
import type { Tab, FlashcardRow } from "@/types";

interface Props { params: { id: string } }

export default async function DeckDetailPage({ params }: Props) {
  const adminSupabase = createAdminClient();
  const supabase = createClient();

  // 1. Fetch Metadata
  const { data: deck } = await adminSupabase
    .from("decks")
    .select("id, title, description, level, access_level, preview_word_limit")
    .eq("id", params.id)
    .single();

  if (!deck) notFound();

  // 2. Determine Access
  let fullAccess = deck.access_level === "public";
  const { data: { user } } = await supabase.auth.getUser();

  if (!fullAccess && user) {
    const { data: userDeck } = await adminSupabase
      .from("user_decks")
      .select("expired_at")
      .eq("user_id", user.id)
      .eq("deck_id", params.id)
      .maybeSingle();

    if (userDeck && hasFullAccess(userDeck.expired_at)) {
      fullAccess = true;
    }
  }

  // 3. Fetch Content (Implementation of Step 2 logic)
  let tabs: Tab[] = [];
  let isPreview = false;

  if (fullAccess) {
    const { data: rows } = await adminSupabase
      .from("flashcards")
      .select("content, created_at")
      .eq("deck_id", params.id)
      .order("created_at", { ascending: true });
    
    tabs = (rows ?? []).flatMap(r => extractTabs((r as unknown as FlashcardRow).content));
  } else if (deck.access_level === "preview") {
    // Logic equivalent to calling /api/decks/[id]/preview
    const limit = deck.preview_word_limit || 10;
    const { data: rows } = await adminSupabase
      .from("flashcards")
      .select("content, created_at")
      .eq("deck_id", params.id)
      .order("created_at", { ascending: true });

    const allTabs = (rows ?? []).flatMap(r => extractTabs((r as unknown as FlashcardRow).content));
    let seen = 0;
    tabs = allTabs.map(tab => {
      const remaining = limit - seen;
      if (remaining <= 0) return null;
      const vocab = (tab.vocabulary ?? []).slice(0, remaining);
      seen += vocab.length;
      return { ...tab, vocabulary: vocab };
    }).filter((t): t is Tab => t !== null && t.vocabulary.length > 0);
    isPreview = true;
  } else {
    // authenticated or authorized without access -> unauthorized message or redirect
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <div className="text-6xl mb-6">🔒</div>
        <h2 className="text-2xl font-bold text-[#1a1a2e] mb-2">Bộ đề có giới hạn quyền truy cập</h2>
        <p className="text-muted-foreground mb-6">Vui lòng đăng nhập hoặc liên hệ Admin để được cấp quyền học bộ đề này.</p>
        <div className="flex gap-4">
          <Button variant="brand" asChild><Link href="/login">Đăng nhập ngay</Link></Button>
          <Button variant="outline" asChild><Link href={FACEBOOK_URL} target="_blank">Liên hệ mua tài liệu</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      {isPreview && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2.5 text-center text-sm text-yellow-800 flex items-center justify-center gap-3 flex-wrap">
          <span>🎯 Bản xem trước — tối đa {deck.preview_word_limit} từ.</span>
          <Button variant="brand" size="sm" asChild className="rounded-full h-7 text-xs px-3">
            <Link href="/login">Đăng nhập để học đầy đủ</Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="rounded-full h-7 text-xs px-3">
            <Link href={FACEBOOK_URL} target="_blank">💬 Mua bộ đề</Link>
          </Button>
        </div>
      )}
      <FlashcardPlayer
        tabs={tabs}
        deckTitle={deck.title}
        deckDesc={deck.description ?? undefined}
        isDemo={isPreview}
        deckId={fullAccess ? deck.id : undefined}
      />
    </div>
  );
}
