import { notFound } from "next/navigation";
import Link from "next/link";
import { serverApiClient } from "@/lib/server-api-client";
import { FACEBOOK_URL } from "@/lib/constants";
import { FlashcardPlayer } from "@/components/flashcard/FlashcardPlayer";
import { Button } from "@/components/ui/button";
import type { Tab } from "@/types";

interface Props { params: { id: string } }

interface DeckContentResponse {
  deck: { id: string; title: string; description: string | null };
  tabs: Tab[];
  isDemo: boolean;
  previewLimit?: number;
  totalWords: number;
}

export default async function DeckDetailPage({ params }: Props) {
  // All data goes through the Express API server
  // GET /api/decks/:id/content handles auth check, access control, and content fetching
  let contentData: DeckContentResponse | null = null;
  let isForbidden = false;

  try {
    contentData = await serverApiClient.get<DeckContentResponse>(`/decks/${params.id}/content`);
  } catch (err: any) {
    const msg = err?.message ?? "";
    if (msg.includes("403") || msg.toLowerCase().includes("forbidden")) {
      isForbidden = true;
    } else if (msg.includes("404")) {
      notFound();
    } else {
      // Re-throw unexpected errors
      throw err;
    }
  }

  // No access at all
  if (isForbidden || !contentData) {
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

  const { deck, tabs, isDemo: isPreview, previewLimit } = contentData;

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
        previewLimit={previewLimit ?? 10}
        deckId={isPreview ? undefined : deck.id}
      />
    </div>
  );
}
