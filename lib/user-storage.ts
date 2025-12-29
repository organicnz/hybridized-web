import { createClient } from "@/lib/supabase/client";

/**
 * User-scoped localStorage utility.
 * Prefixes keys with user ID to prevent data leakage between accounts.
 * Falls back to 'anonymous' prefix for logged-out users.
 */

let cachedUserId: string | null = null;

/**
 * Get the current user ID (cached for performance).
 * Returns 'anonymous' if not authenticated.
 */
async function getUserId(): Promise<string> {
  if (cachedUserId) return cachedUserId;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  cachedUserId = user?.id ?? "anonymous";
  return cachedUserId;
}

/**
 * Get user ID synchronously (uses cached value).
 * Returns 'anonymous' if cache is empty.
 */
function getUserIdSync(): string {
  return cachedUserId ?? "anonymous";
}

/**
 * Update the cached user ID. Call this on auth state changes.
 */
export function setCurrentUserId(userId: string | null): void {
  cachedUserId = userId ?? "anonymous";
}

/**
 * Get a user-scoped key for localStorage.
 */
function getScopedKey(key: string, userId: string): string {
  return `${userId}:${key}`;
}

/**
 * Get an item from user-scoped localStorage.
 */
export async function getUserStorageItem(key: string): Promise<string | null> {
  const userId = await getUserId();
  return localStorage.getItem(getScopedKey(key, userId));
}

/**
 * Get an item from user-scoped localStorage (sync version).
 * Uses cached user ID - ensure setCurrentUserId was called first.
 */
export function getUserStorageItemSync(key: string): string | null {
  const userId = getUserIdSync();
  return localStorage.getItem(getScopedKey(key, userId));
}

/**
 * Set an item in user-scoped localStorage.
 */
export async function setUserStorageItem(
  key: string,
  value: string
): Promise<void> {
  const userId = await getUserId();
  localStorage.setItem(getScopedKey(key, userId), value);
}

/**
 * Set an item in user-scoped localStorage (sync version).
 * Uses cached user ID - ensure setCurrentUserId was called first.
 */
export function setUserStorageItemSync(key: string, value: string): void {
  const userId = getUserIdSync();
  localStorage.setItem(getScopedKey(key, userId), value);
}

/**
 * Remove an item from user-scoped localStorage.
 */
export async function removeUserStorageItem(key: string): Promise<void> {
  const userId = await getUserId();
  localStorage.removeItem(getScopedKey(key, userId));
}

/**
 * Remove an item from user-scoped localStorage (sync version).
 */
export function removeUserStorageItemSync(key: string): void {
  const userId = getUserIdSync();
  localStorage.removeItem(getScopedKey(key, userId));
}

/**
 * Clear all user-scoped storage for the current user.
 * Call this on sign-out to clean up user data.
 */
export function clearCurrentUserStorage(): void {
  const userId = getUserIdSync();
  if (userId === "anonymous") return;

  const prefix = `${userId}:`;
  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

/**
 * Migrate existing non-scoped localStorage to user-scoped storage.
 * Call this once when user logs in to migrate their existing data.
 */
export async function migrateToUserStorage(keys: string[]): Promise<void> {
  const userId = await getUserId();
  if (userId === "anonymous") return;

  for (const key of keys) {
    const existingValue = localStorage.getItem(key);
    if (existingValue !== null) {
      // Move to user-scoped key
      localStorage.setItem(getScopedKey(key, userId), existingValue);
      // Remove old key
      localStorage.removeItem(key);
    }
  }
}
