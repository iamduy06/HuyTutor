"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/types";

export function useUser() {
  const [user,    setUser]    = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tạo client mới mỗi lần mount — tránh stale singleton khi navigate giữa layouts
    const supabase = createClient();
    let mounted = true;

    async function loadUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!mounted) return;

      if (authUser) {
        const { data } = await supabase
          .from("users").select("*").eq("id", authUser.id).single();
        if (mounted) setUser(data ?? null);
      } else {
        if (mounted) setUser(null);
      }
      if (mounted) setLoading(false);
    }

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (session?.user) {
          const { data } = await supabase
            .from("users").select("*").eq("id", session.user.id).single();
          if (mounted) setUser(data ?? null);
        } else {
          if (mounted) setUser(null);
        }
        if (mounted) setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // chạy 1 lần per mount — OK vì layout remount khi navigate qua URL

  return { user, loading };
}
