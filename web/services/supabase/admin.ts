import { createClient } from "@supabase/supabase-js";

// Safe client fallback for server rendering without crashing when SERVICE_ROLE_KEY is absent in FE
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://supabase-proxy.huynhthanhduy06.workers.dev/";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "dummy_key";
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
