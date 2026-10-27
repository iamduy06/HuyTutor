import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FACEBOOK_URL } from "@/lib/constants";
import { FlashcardPlayer } from "@/components/flashcard/FlashcardPlayer";
import { Button } from "@/components/ui/button";
import type { Tab } from "@/types";

interface Props { params: Promise<{ id: string }> }

export default async function DeckDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://flashcard-api.huytutor.edu.vn/api/v1";

  let res: globalThis.Response;
  try {
    res = await fetch(`${apiUrl}/decks/${id}/content`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
    });
  } catch (err) {
    console.error("Failed to fetch deck content from backend:", err);
    notFound();
  }

  if (res.status === 404) notFound();

  if (res.status === 403) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <div className="text-6xl mb-6">🔒</div>
        <h2 className="text-2xl font-bold text-[#1a1a2e] mb-2">Bộ Flashcard có giới hạn quyền truy cập</h2>
        <p className="text-muted-foreground mb-6">Vui lòng đăng nhập hoặc liên hệ Admin để được cấp quyền học bộ Flashcard này.</p>
        <div className="flex gap-4">
          <Button variant="brand" asChild><Link href="/login">Đăng nhập ngay</Link></Button>
          <Button variant="outline" asChild><Link href={FACEBOOK_URL} target="_blank">Liên hệ mua tài liệu</Link></Button>
        </div>
      </div>
    );
  }

  const data = await res.json();
  const deck = data.deck;
  const tabs: Tab[] = data.tabs ?? [];
  const isPreview = Boolean(data.isDemo);
  const previewLimit = data.previewLimit ?? 10;

  if (!isPreview && token) {
    redirect(`/learning/${id}`);
  }

  return (
    <div className="flex flex-col flex-1">
      {isPreview && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2.5 text-center text-sm text-yellow-800 flex items-center justify-center gap-3 flex-wrap">
          <span>🎯 Bản xem trước — tối đa {previewLimit} từ.</span>
          <Button variant="brand" size="sm" asChild className="rounded-full h-7 text-xs px-3">
            <Link href="/login">Đăng nhập để học đầy đủ</Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="rounded-full h-7 text-xs px-3">
            <Link href={FACEBOOK_URL} target="_blank">💬 Mua bộ Flashcard</Link>
          </Button>
        </div>
      )}
      <FlashcardPlayer
        tabs={tabs}
        deckTitle={deck.title}
        deckDesc={deck.description ?? undefined}
        isDemo={isPreview}
        previewLimit={previewLimit}
        deckId={!isPreview ? deck.id : undefined}
      />
    </div>
  );
}
