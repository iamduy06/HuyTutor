import { createBrowserClient } from "@supabase/ssr";

/**
 * Tạo Supabase browser client.
 * KHÔNG dùng singleton module-level — gây stale state khi navigate giữa layouts.
 * createBrowserClient() tự deduplicate internal connections nên gọi nhiều lần vẫn OK.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
