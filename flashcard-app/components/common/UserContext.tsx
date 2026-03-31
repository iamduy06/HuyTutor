"use client";

/**
 * UserContext — single source of truth cho auth state.
 * Mount 1 lần ở root layout → không bao giờ reset khi navigate.
 *
 * ROOT CAUSE của bug cũ:
 * - loadUser() và onAuthStateChange dùng 2 createClient() khác nhau
 * - Supabase SSR tạo 2 instance riêng → không share session token
 * - Sau reload, loadUser fetch xong → set user → onAuthStateChange fire
 *   với event INITIAL_SESSION nhưng session=null (vì instance khác)
 *   → override user về null → nút biến mất
 *
 * FIX: tạo 1 instance duy nhất, dùng cho cả load và subscription.
 */

import {
  createContext, useContext, useEffect, useState,
  useRef, useCallback, type ReactNode,
} from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserProfile } from "@/types";

interface UserContextValue {
  user: UserProfile | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
  refresh: async () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // 1 instance duy nhất — tạo trong ref để không recreate khi re-render
  const clientRef = useRef<SupabaseClient | null>(null);
  function getClient(): SupabaseClient {
    if (!clientRef.current) {
      clientRef.current = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    }
    return clientRef.current;
  }

  const fetchProfile = useCallback(async (userId: string) => {
    const supabase = getClient();
    const { data } = await supabase
      .from("users").select("*").eq("id", userId).single();
    return data as UserProfile | null;
  }, []); // eslint-disable-line

  const loadUser = useCallback(async () => {
    const supabase = getClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const profile = await fetchProfile(authUser.id);
      setUser(profile);
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [fetchProfile]); // eslint-disable-line

  useEffect(() => {
    const supabase = getClient();

    // Fetch session ngay lập tức
    loadUser();

    // Subscribe — CÙNG instance với loadUser
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // INITIAL_SESSION fire khi trang load — chỉ cần set loading=false
        // nếu loadUser() đã chạy xong và set user rồi thì không override
        if (event === "SIGNED_OUT") {
          setUser(null);
          setLoading(false);
          return;
        }
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          if (session?.user) {
            const profile = await fetchProfile(session.user.id);
            setUser(profile);
          }
          setLoading(false);
          return;
        }
        // INITIAL_SESSION: chỉ set loading=false, giữ user do loadUser() set
        if (event === "INITIAL_SESSION") {
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <UserContext.Provider value={{ user, loading, refresh: loadUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
