import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client cho login/logout/profile pages.
 * UserContext dùng instance riêng trong useRef để không share state.
 * Đây là instance độc lập, chỉ dùng cho 1-shot operations (signIn, signOut, updateUser).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
