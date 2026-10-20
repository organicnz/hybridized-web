"use client";

import { getSupabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const supabase = await getSupabase();
      if (cancelled) return;

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      });

      try {
        const {
          data: { user: current },
        } = await supabase.auth.getUser();
        if (!cancelled) setUser(current);
      } catch (error) {
        console.error("Error fetching user:", error);
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }

      return () => subscription.unsubscribe();
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { user, loading, isAuthenticated: !!user };
}
