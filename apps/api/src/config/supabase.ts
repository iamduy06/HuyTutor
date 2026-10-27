import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';

let adminClient: SupabaseClient | null = null;

/**
 * Singleton Supabase client with SERVICE_ROLE_KEY.
 * Bypasses Row Level Security (RLS) for admin operations.
 */
export function getAdminClient(): SupabaseClient {
  if (!adminClient) {
    adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return adminClient;
}

/**
 * Standard Supabase client with ANON_KEY.
 * If token is provided, requests will include Authorization: Bearer <token> for RLS.
 */
export function getSupabaseClient(token?: string): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined,
  });
}
