"use client";

import {
  createContext, useContext, useEffect,
  useState, useCallback, type ReactNode,
} from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { UserProfile } from "@/types";

// ── Singleton browser client ──────────────────────────────────────────────────
// 1 instance duy nhất cho toàn bộ app client-side
// SiteHeader signOut & UserContext subscription đều dùng cùng instance này
// → SIGNED_OUT event chắc chắn được nhận
let _client: ReturnType<typeof createBrowserClient> | null = null;
export function getSupabaseClient() {
  if (!_client) {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return _client;
}

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

interface UserProviderProps {
  children: ReactNode;
  initialUser: UserProfile | null;
}

export function UserProvider({ children, initialUser }: UserProviderProps) {
  const [user,    setUser]    = useState<UserProfile | null>(initialUser);
  const [loading, setLoading] = useState(false);

  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    const { data } = await getSupabaseClient()
      .from("users").select("*").eq("id", userId).single();
    return (data as UserProfile) ?? null;
  }, []);

  const refresh = useCallback(async () => {
    const { data: { user: authUser } } = await getSupabaseClient().auth.getUser();
    if (authUser) {
      const profile = await fetchProfile(authUser.id);
      setUser(profile);
    } else {
      setUser(null);
    }
  }, [fetchProfile]);

  useEffect(() => {
    const supabase = getSupabaseClient();

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
            if (session?.user) {
              if (!user || user.id !== session.user.id) {
                const profile = await fetchProfile(session.user.id);
                setUser(profile);
              }
            } else if (!session) {
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
