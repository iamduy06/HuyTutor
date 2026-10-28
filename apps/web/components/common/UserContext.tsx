"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type { UserProfile } from "@/types";
import { getClientToken, clearClientToken } from "@/lib/auth";

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
  const [user, setUser] = useState<UserProfile | null>(initialUser);
  const [loading, setLoading] = useState(false);

  const fetchRequestId = useRef(0);
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
      setLoading(false);
    }, 5000);
  };

  const fetchProfile = useCallback(async (): Promise<UserProfile | null> => {
    try {
      const headers: Record<string, string> = {};
      const token = getClientToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch("/api/me/profile", { headers });
      if (res.ok) {
        const data = await res.json();
        return data.user as UserProfile;
      }
      if (res.status === 401) {
        clearClientToken();
        return null;
      }
      return null;
    } catch (err) {
      console.error("[USER_CONTEXT] Error fetching profile from backend:", err);
      return null;
    }
  }, []);

  const refresh = useCallback(async () => {
    const currentId = ++fetchRequestId.current;
    setLoading(true);
    startFailSafe();

    try {
      const profile = await fetchProfile();
      if (currentId === fetchRequestId.current) {
        setUser(profile);
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
    if (!initialUser) {
      refresh();
    }
  }, [initialUser, refresh]);

  return (
    <UserContext.Provider value={{ user, loading, refresh }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
