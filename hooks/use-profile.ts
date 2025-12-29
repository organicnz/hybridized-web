"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./use-auth";
import type { Database } from "@/lib/types/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!error) {
        setProfile(data);
      }
    } catch {
      // Profile fetch failed
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error("Not authenticated") };

    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();

    if (!error && data) {
      setProfile(data);
      // Force a refetch to ensure we have the latest data
      await fetchProfile();
    }

    return { data, error };
  };

  const refetch = () => {
    setLoading(true);
    return fetchProfile();
  };

  return { profile, loading, updateProfile, refetch };
}
