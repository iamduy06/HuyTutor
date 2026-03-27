"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/services/supabase/client";
import { Deck } from "@/types";

export function useDecks() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["decks"],
    queryFn: async (): Promise<Deck[]> => {
      const { data, error } = await supabase
        .from("decks")
        .select(`*, flashcards(id)`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data ?? []).map((d) => ({
        ...d,
        word_count: Array.isArray(d.flashcards)
          ? d.flashcards.reduce((acc: number, fc: { content: { vocabulary?: unknown[] } }) => {
              const vocab = fc?.content?.vocabulary;
              return acc + (Array.isArray(vocab) ? vocab.length : 0);
            }, 0)
          : 0,
      }));
    },
  });
}

export function useDeck(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["deck", id],
    queryFn: async (): Promise<Deck | null> => {
      const { data, error } = await supabase
        .from("decks")
        .select(`*, flashcards(*)`)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useUserDecks() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["user-decks"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_decks")
        .select(`*, deck:decks(*)`)
        .eq("user_id", user.id);

      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpdateProgress() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userDeckId,
      progress_percent,
      learned_count,
      streak,
    }: {
      userDeckId: string;
      progress_percent: number;
      learned_count: number;
      streak: number;
    }) => {
      const { error } = await supabase
        .from("user_decks")
        .update({ progress_percent, learned_count, streak })
        .eq("id", userDeckId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-decks"] });
    },
  });
}
