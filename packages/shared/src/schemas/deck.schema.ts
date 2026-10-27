import { z } from "zod";

export const accessLevelConfigSchema = z.object({
  public: z.boolean().default(false),
  auth: z.boolean().default(false),
  paid: z.boolean().default(true),
  preview: z.boolean().default(false),
  preview_word_limit: z.number().default(10),
});

export const createDeckSchema = z.object({
  title: z.string().min(1, "Tiêu đề bộ đề là bắt buộc"),
  description: z.string().nullable().optional(),
  level: z.string().nullable().optional(),
  level_min: z.string().nullable().optional(),
  level_max: z.string().nullable().optional(),
  group_id: z.string().nullable().optional(),
  access_level: accessLevelConfigSchema.default({
    public: false,
    auth: false,
    paid: true,
    preview: false,
    preview_word_limit: 10,
  }),
});

export const getDeckDemoQuerySchema = z.object({
  deckId: z.string().uuid("deckId phải là UUID hợp lệ"),
});

export const deckIdParamSchema = z.object({
  id: z.string().uuid("id phải là UUID hợp lệ"),
});

export const updateDeckSchema = createDeckSchema.partial();

export const vocabItemSchema = z.object({
  word: z.string().min(1),
  phonetic: z.string().optional(),
  meaning: z.string().min(1),
  type: z.string().optional(),
  example: z.string().optional(),
  translation: z.string().optional(),
  synonyms: z.union([z.string(), z.array(z.string())]).optional(),
  antonyms: z.union([z.string(), z.array(z.string())]).optional(),
  cefr: z.string().optional(),
});

export const tabSchema = z.object({
  id: z.string().optional(),
  label: z.string().optional(),
  desc: z.string().optional(),
  vocabulary: z.array(vocabItemSchema),
});

export const saveFlashcardContentSchema = z.object({
  content: z.union([
    z.object({ tabs: z.array(tabSchema) }),
    tabSchema,
    z.array(tabSchema),
  ]),
});

export type CreateDeckInput = z.infer<typeof createDeckSchema>;
export type UpdateDeckInput = z.infer<typeof updateDeckSchema>;
export type SaveFlashcardContentInput = z.infer<typeof saveFlashcardContentSchema>;
