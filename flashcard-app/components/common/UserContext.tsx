"use client";

import {
  createContext, useContext, useEffect,
  useState, useCallback, useRef, type ReactNode,
} from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { UserProfile } from "@/types";

// ── Singleton browser client ──────────────────────────────────────────────────
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
  refresh: async () => { },
});

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  // Dùng ref để track request ID mới nhất, tránh race condition
  const fetchRequestId = useRef(0);
  // Dùng ref để track timeout ID cho fail-safe
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  const clearFailSafe = () => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
      timeoutId.current = null;
    }
  };

  const startFailSafe = () => {
    clearFailSafe();
    timeoutId.current = setTimeout(() => {
      console.warn("[USER_CONTEXT] Fail-safe triggered: Loading forced to false after 5s.");
      setLoading(false);
    }, 5000);
  };

  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    const supabase = getSupabaseClient();

    // Fetch profile chính
    const { data: profile } = await supabase
      .from("users").select("*").eq("id", userId).single();

    if (!profile) return null;

    // Kiểm tra xem có là subadmin của bất kỳ nhóm nào không
    const { data: groupSub } = await supabase
      .from("group_users")
      .select("id")
      .eq("user_id", userId)
      .eq("is_subadmin", true)
      .limit(1)
      .maybeSingle();

    return {
      ...(profile as UserProfile),
      is_subadmin: !!groupSub
    };
  }, []);

  const refresh = useCallback(async () => {
    const currentId = ++fetchRequestId.current;
    setLoading(true);
    startFailSafe();

    try {
      const { data: { user: authUser } } = await getSupabaseClient().auth.getUser();
      if (authUser) {
        const profile = await fetchProfile(authUser.id);
        if (currentId === fetchRequestId.current) {
          console.log(`[USER_CONTEXT] Profile refreshed (ID:${currentId}):`, profile);
          setUser(profile);
        }
      } else {
        if (currentId === fetchRequestId.current) setUser(null);
      }
    } catch (err) {
      console.error(`[USER_CONTEXT] Refresh error (ID:${currentId}):`, err);
    } finally {
      if (currentId === fetchRequestId.current) {
        setLoading(false);
        clearFailSafe();
      }
    }
  }, [fetchProfile]);

  useEffect(() => {
    const supabase = getSupabaseClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentId = ++fetchRequestId.current;
        console.log(`[USER_CONTEXT] Auth event: ${event} (ID:${currentId})`);

        switch (event) {
          case "SIGNED_IN":
          case "TOKEN_REFRESHED":
          case "USER_UPDATED":
            if (session?.user) {
              setLoading(true);
              startFailSafe();
              try {
                const profile = await fetchProfile(session.user.id);
                if (currentId === fetchRequestId.current) {
                  console.log(`[USER_CONTEXT] Fetch success (ID:${currentId}):`, profile);
                  setUser(profile);
                }
              } finally {
                if (currentId === fetchRequestId.current) {
                  setLoading(false);
                  clearFailSafe();
                }
              }
            }
            break;

          case "SIGNED_OUT":
            if (currentId === fetchRequestId.current) {
              setUser(null);
              setLoading(false);
              clearFailSafe();
            }
            break;

          case "INITIAL_SESSION":
            if (session?.user) {
              setLoading(true);
              startFailSafe();
              try {
                const profile = await fetchProfile(session.user.id);
                if (currentId === fetchRequestId.current) {
                  console.log(`[USER_CONTEXT] Initial sync complete (ID:${currentId}):`, profile);
                  setUser(profile);
                }
              } finally {
                if (currentId === fetchRequestId.current) {
                  setLoading(false);
                  clearFailSafe();
                }
              }
            } else {
              if (currentId === fetchRequestId.current) {
                setLoading(false);
                clearFailSafe();
              }
            }
            break;
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      clearFailSafe();
    };
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
