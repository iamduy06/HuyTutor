import { z } from "zod";

export const updateProgressSchema = z.object({
  deck_id: z.string().uuid("deck_id không hợp lệ"),
  learned_count: z.number().int().min(0),
  progress_percent: z.number().int().min(0).max(100),
});

export const getGameVocabQuerySchema = z.object({
  deckId: z.string().nullable().optional(),
  limit: z.coerce.number().int().positive().optional(),
  tabIds: z.string().optional(),
});

export type UpdateProgressInput = z.infer<typeof updateProgressSchema>;
export type GetGameVocabQuery = z.infer<typeof getGameVocabQuerySchema>;
