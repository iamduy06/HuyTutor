import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(10000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NODE_VERSION: z.string().optional(),
  SUPABASE_URL: z.string().url().default(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'),
  SUPABASE_ANON_KEY: z.string().min(1).default(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).default(process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key'),
  CORS_ORIGIN: z.string().default(process.env.CORS_ORIGINS || 'http://localhost:3000,https://flashcard.huytutor.edu.vn,https://flashcard2.huytutor.edu.vn'),
  CORS_ORIGINS: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('[CONFIG] Invalid environment variables:', parsed.error.format());
  throw new Error('Invalid environment configuration');
}

export const env = {
  ...parsed.data,
  CORS_ORIGIN: parsed.data.CORS_ORIGINS || parsed.data.CORS_ORIGIN,
};
