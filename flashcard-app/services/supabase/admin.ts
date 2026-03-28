import { createClient } from "@supabase/supabase-js";

// ⚠️  Only import this in server-side code (API routes, server actions)
// Never expose SUPABASE_SERVICE_ROLE_KEY to the client
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
