import type { Database } from "@/lib/types/database.types";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for privileged, server-to-server operations
 * (sync/match endpoints). Bypasses RLS. Returns `null` when no service key is
 * configured so callers can fall back to the request-scoped client.
 */
export function createServiceClient() {
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;

  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
