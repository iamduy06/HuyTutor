import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://supabase-proxy.huynhthanhduy06.workers.dev/";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy_key";
  return createBrowserClient(url, key);
}
