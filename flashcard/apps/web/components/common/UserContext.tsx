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
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();

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
      const res = await fetch("/api/me/profile", { headers, credentials: "include" });
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

  // Đồng bộ khi initialUser từ server thay đổi
  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
    }
  }, [initialUser]);

  // Tự động nạp profile khi chưa có user trên client
  useEffect(() => {
    if (!initialUser && !user) {
      refresh();
    }
  }, [initialUser, user, refresh]);

  // Lắng nghe khi chuyển route (vd từ /login sang /dashboard)
  useEffect(() => {
    if (!user) {
      refresh();
    }
  }, [pathname, user, refresh]);

  // Lắng nghe event xác thực trên toàn ứng dụng
  useEffect(() => {
    const handleAuthEvent = () => {
      refresh();
    };
    window.addEventListener("hut_auth_changed", handleAuthEvent);
    return () => {
      window.removeEventListener("hut_auth_changed", handleAuthEvent);
    };
  }, [refresh]);

  return (
    <UserContext.Provider value={{ user, loading, refresh }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
