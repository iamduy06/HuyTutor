import { z } from "zod";

export const PAGINATION_LIMITS = [10, 20, 30, 50, 100] as const;
export type PaginationLimit = (typeof PAGINATION_LIMITS)[number];

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce
    .number()
    .int()
    .refine((val) => (PAGINATION_LIMITS as readonly number[]).includes(val), {
      message: "Limit must be one of [10, 20, 30, 50, 100]",
    })
    .default(20),
  search: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

