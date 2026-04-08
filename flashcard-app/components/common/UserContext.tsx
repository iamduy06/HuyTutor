"use client";

import {
  createContext, useContext, useEffect,
  useState, useCallback, type ReactNode,
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
  loading: true,
  refresh: async () => {},
});

interface UserProviderProps {
  children: ReactNode;
  initialUser: UserProfile | null;
}

export function UserProvider({ children, initialUser }: UserProviderProps) {
  const [user,    setUser]    = useState<UserProfile | null>(initialUser);
  const [loading, setLoading] = useState(!initialUser); // Only load if no initialUser

  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await getSupabaseClient()
        .from("users").select("*").eq("id", userId).single();
      if (error) throw error;
      return (data as UserProfile);
    } catch (err) {
      console.error("Error fetching user profile:", err);
      return null;
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user: authUser } } = await getSupabaseClient().auth.getUser();
      if (authUser) {
        const profile = await fetchProfile(authUser.id);
        setUser(profile);
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchProfile]);

  useEffect(() => {
    const supabase = getSupabaseClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // console.log("AUTH EVENT:", event, session?.user?.email);
        
        switch (event) {
          case "PASSWORD_RECOVERY":
            window.location.href = "/reset-password";
            break;

          case "SIGNED_IN":
          case "TOKEN_REFRESHED":
          case "USER_UPDATED":
            if (session?.user) {
              const profile = await fetchProfile(session.user.id);
              setUser(profile);
            }
            setLoading(false);
            break;

          case "SIGNED_OUT":
            setUser(null);
            setLoading(false);
            break;

          case "INITIAL_SESSION":
            if (session?.user) {
              // Only fetch if session is different or state is empty
              if (!user || user.id !== session.user.id) {
                const profile = await fetchProfile(session.user.id);
                setUser(profile);
              }
            } else if (!session) {
              setUser(null);
            }
            setLoading(false);
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
