"use client";

/**
 * UserContext — Context toàn app, mount 1 lần ở root layout.
 * Không bị mất khi navigate giữa (public)/(dashboard)/(admin) route groups.
 */

import {
  createContext, useContext, useEffect, useState, useCallback,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
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

  const loadUser = useCallback(async () => {
    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (authUser) {
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();
      setUser(data ?? null);
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Initial load
    loadUser();

    // Listen to auth state changes (login / logout / token refresh)
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT") {
          setUser(null);
          setLoading(false);
          return;
        }
        if (session?.user) {
          const { data } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single();
          setUser(data ?? null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [loadUser]);

  return (
    <UserContext.Provider value={{ user, loading, refresh: loadUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
