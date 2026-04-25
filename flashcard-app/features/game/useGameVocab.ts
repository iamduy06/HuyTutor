"use client";

import { useQuery } from "@tanstack/react-query";
import type { VocabItem } from "@/types";

export interface GameVocabResponse {
  vocab: VocabItem[];
  deckTitle: string;
  totalCount: number;
}

async function fetchGameVocab(deckId: string | null, limit?: number): Promise<GameVocabResponse> {
  const params = new URLSearchParams();
  params.set("deckId", deckId ?? "all");
  if (limit) params.set("limit", String(limit));

  const res = await fetch(`/api/game/vocab?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Hook fetch vocab cho game.
 * @param deckId  null = "all decks"
 * @param limit   số từ tối đa (random từ pool), undefined = lấy hết
 */
export function useGameVocab(deckId: string | null | undefined, limit?: number) {
  return useQuery<GameVocabResponse, Error>({
    queryKey: ["game-vocab", deckId ?? "all", limit],
    queryFn: () => fetchGameVocab(deckId ?? null, limit),
    staleTime: 5 * 60 * 1000,  // cache 5 phút
    enabled: deckId !== undefined, // chờ đến khi đã chọn deck
    retry: false,
  });
}
