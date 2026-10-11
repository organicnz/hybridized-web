import { createClient } from "@/lib/supabase/server";

/**
 * Authorise a mutating sync/match endpoint.
 *
 * Accepts either a shared bearer secret (`SYNC_SECRET`) for cron/scripts, or an
 * authenticated Supabase user whose profile is flagged `admin`. Returns `true`
 * when the caller is authorised.
 */
export async function isSyncAuthorized(request: Pick<Request, "headers">): Promise<boolean> {
  const secret = process.env.SYNC_SECRET;
  if (secret) {
    const header = request.headers.get("authorization");
    if (header === `Bearer ${secret}`) return true;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("admin")
        .eq("id", user.id)
        .single();
      if (profile?.admin) return true;
    }
  } catch {
    // Fall through to the denial below.
  }

  return false;
}
