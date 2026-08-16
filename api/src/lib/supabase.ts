import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Admin client — uses service role key, bypasses RLS.
 * Only use server-side. Never expose to clients.
 */
export function createAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Verify a user's JWT access token from Authorization header.
 * Returns the authenticated user or null.
 */
export async function verifyToken(token: string) {
  // Use admin client to verify the JWT
  const adminClient = createAdminClient();
  const { data: { user }, error } = await adminClient.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

/**
 * Anon client — for public operations that respect RLS.
 */
export function createAnonClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
