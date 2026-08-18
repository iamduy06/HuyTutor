"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlashcardPlayer } from "@/components/flashcard/FlashcardPlayer";
import { useLearningStore } from "@/features/learning/store";
import type { Tab } from "@/types";

interface DeckData {
  deck: { id: string; title: string; description: string | null };
  tabs: Tab[];
  isDemo: boolean;
  previewLimit?: number;
  totalWords: number;
}

class ForbiddenError extends Error {
  constructor() { super("Forbidden"); }
}

async function fetchDeck(deckId: string): Promise<DeckData> {
  const res = await fetch(`/api/decks/${deckId}/content`);
  if (res.status === 403) throw new ForbiddenError();
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}


interface WorkspaceProps {
  deckId: string;
}

export function Workspace({ deckId }: WorkspaceProps) {
  const { reset } = useLearningStore();
  const router = useRouter();

  const { data, isLoading, error } = useQuery<DeckData, Error>({
    queryKey: ["deck", deckId],
    queryFn: () => fetchDeck(deckId),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  useEffect(() => { reset(); }, [deckId, reset]);

  // Redirect vào trang thông báo nếu không có quyền truy cập
  useEffect(() => {
    if (error instanceof ForbiddenError) {
      router.replace("/learning/unauthorized");
    }
  }, [error, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-20 gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-brand" />
        <p className="text-muted-foreground">Đang tải Flashcard…</p>
      </div>
    );
  }

  if (error instanceof ForbiddenError) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-20 gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-brand" />
        <p className="text-muted-foreground">Đang chuyển hướng…</p>
      </div>
    );
  }

  if (error || !data || !data.deck) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-20 gap-4 text-muted-foreground">
        <AlertCircle className="w-10 h-10 text-destructive" />
        <p className="font-medium">{error?.message ?? "Không tìm thấy Flashcard hoặc bạn không có quyền truy cập."}</p>
        <Button variant="brand-outline" asChild>
          <Link href="/dashboard">← Quay lại Dashboard</Link>
        </Button>
      </div>
    );
  }


  // Dự phòng nếu tabs bị undefined/null
  const tabs = data.tabs ?? [];

  if (tabs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-20 gap-4 text-muted-foreground">
        <AlertCircle className="w-10 h-10 text-brand" />
        <p className="font-medium">Bộ Flashcard này hiện đang trống hoặc đang được cập nhật.</p>
        <Button variant="brand-outline" asChild>
          <Link href="/dashboard">← Quay lại Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <FlashcardPlayer
      deckId={deckId}
      tabs={tabs}
      deckTitle={data.deck.title}
      deckDesc={data.deck.description ?? undefined}
      isDemo={data.isDemo}
      previewLimit={data.previewLimit}
    />
  );
}
