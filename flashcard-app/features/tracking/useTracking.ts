"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/services/supabase/client";

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

export function useStreakUpdate() {
  const supabase = createClient();

  return async (userDeckId: string) => {
    const { data } = await supabase
      .from("user_decks")
      .select("streak")
      .eq("id", userDeckId)
      .single();

    const newStreak = (data?.streak ?? 0) + 1;
    await supabase
      .from("user_decks")
      .update({ streak: newStreak })
      .eq("id", userDeckId);
    return newStreak;
  };
}
