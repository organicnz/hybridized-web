import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

/**
 * Get the current session
 */
export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/**
 * Refresh the current session
 */
export async function refreshSession() {
  const supabase = await createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.refreshSession();

  if (error) {
    console.error("Error refreshing session:", error);
    return null;
  }

  return session;
}

/**
 * Clear all auth cookies (for manual logout)
 */
export async function clearAuthCookies() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  // Clear all Supabase auth cookies
  allCookies.forEach((cookie) => {
    if (cookie.name.startsWith("sb-")) {
      cookieStore.delete(cookie.name);
    }
  });
}

/**
 * Get session expiry time
 */
export async function getSessionExpiry() {
  const session = await getSession();
  if (!session) return null;

  return new Date(session.expires_at! * 1000);
}

/**
 * Check if session is expired
 */
export async function isSessionExpired() {
  const expiry = await getSessionExpiry();
  if (!expiry) return true;

  return expiry < new Date();
}
