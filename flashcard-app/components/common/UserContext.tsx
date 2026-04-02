"use client";

/**
 * UserContext — Giải pháp header không flash.
 *
 * Flow:
 * 1. Server (root layout) đọc cookie Supabase → lấy UserProfile → truyền qua initialUser
 * 2. UserProvider khởi tạo state = initialUser, loading = false → header render đúng NGAY
 * 3. onAuthStateChange sync các event thực (login/logout/token refresh)
 */

import {
  createContext, useContext, useEffect,
  useState, useCallback, type ReactNode,
} from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { UserProfile } from "@/types";

// ── Singleton browser client ──────────────────────────────────────────────────
// Quan trọng: chỉ 1 instance duy nhất trong toàn bộ app client
// Nhiều instance = nhiều subscription conflict = race condition
let _client: ReturnType<typeof createBrowserClient> | null = null;
function getClient() {
  if (!_client) {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return _client;
}

// ── Context ───────────────────────────────────────────────────────────────────
interface UserContextValue {
  user: UserProfile | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: false,
  refresh: async () => {},
});

// ── Provider ──────────────────────────────────────────────────────────────────
interface UserProviderProps {
  children: ReactNode;
  initialUser: UserProfile | null;
}

export function UserProvider({ children, initialUser }: UserProviderProps) {
  // Khởi tạo với dữ liệu từ server → không bao giờ flash
  const [user,    setUser]    = useState<UserProfile | null>(initialUser);
  const [loading, setLoading] = useState(false);

  // Fetch profile từ DB (sau khi auth event xác nhận user id)
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    const { data } = await getClient()
      .from("users").select("*").eq("id", userId).single();
    return (data as UserProfile) ?? null;
  }, []);

  // Dùng cho logout button hoặc khi cần force refresh
  const refresh = useCallback(async () => {
    const { data: { user: authUser } } = await getClient().auth.getUser();
    if (authUser) {
      const profile = await fetchProfile(authUser.id);
      setUser(profile);
    } else {
      setUser(null);
    }
  }, [fetchProfile]);

  useEffect(() => {
    const supabase = getClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        switch (event) {
          case "SIGNED_IN":
          case "TOKEN_REFRESHED":
          case "USER_UPDATED":
            if (session?.user) {
              const profile = await fetchProfile(session.user.id);
              setUser(profile);
            }
            break;

          case "SIGNED_OUT":
            setUser(null);
            break;

          case "INITIAL_SESSION":
            // Chạy khi tab load/reload. Session từ cookie đã được server đọc
            // → initialUser đã đúng. Nhưng nếu server render lúc cookie chưa có
            // (ví dụ deploy mới, cookie format thay đổi), sync lại từ client.
            if (session?.user) {
              // Chỉ fetch lại nếu user hiện tại chưa đúng
              if (!user || user.id !== session.user.id) {
                const profile = await fetchProfile(session.user.id);
                setUser(profile);
              }
            } else if (!session) {
              // Không có session → clear
              setUser(null);
            }
            break;
        }
      }
    );

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, refresh }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
