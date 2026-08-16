"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { VocabItem } from "@/types";

export interface GameVocabResponse {
  vocab: VocabItem[];
  deckTitle: string;
  totalCount: number;
}

async function fetchGameVocab(deckId: string | null, limit?: number, tabIds?: string[]): Promise<GameVocabResponse> {
  const params = new URLSearchParams();
  params.set("deckId", deckId ?? "all");
  if (limit) params.set("limit", String(limit));
  if (tabIds && tabIds.length > 0) params.set("tabIds", tabIds.join(","));

  return await apiClient.get<GameVocabResponse>(`/game/vocab?${params.toString()}`);
}

/**
 * Hook fetch vocab cho game.
 * @param deckId  null = "all decks"
 * @param limit   số từ tối đa (random từ pool), undefined = lấy hết
 * @param tabIds  danh sách id của tab được chọn, mảng rỗng = lấy tất cả tab
 */
export function useGameVocab(deckId: string | null | undefined, limit?: number, tabIds?: string[]) {
  return useQuery<GameVocabResponse, Error>({
    queryKey: ["game-vocab", deckId ?? "all", limit, tabIds],
    queryFn: () => fetchGameVocab(deckId ?? null, limit, tabIds),
    staleTime: 5 * 60 * 1000,  // cache 5 phút
    enabled: deckId !== undefined, // chờ đến khi đã chọn deck
    retry: false,
    placeholderData: keepPreviousData,
  });
}
