import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/lib/types/database.types";

export type SettingsUpdate = {
  gains?: number[];
  volume_settings?: { master: number };
};

export type SyncStatus = "idle" | "pending" | "saving" | "saved" | "error";

type StatusCallback = (status: SyncStatus) => void;

type SaveState = {
  pending: SettingsUpdate | null;
  timeoutId: ReturnType<typeof setTimeout> | null;
  isSaving: boolean;
  statusCallbacks: Set<StatusCallback>;
  currentStatus: SyncStatus;
};

const DEBOUNCE_MS = 500;
const MAX_RETRIES = 2;
const OFFLINE_QUEUE_KEY = "settings-offline-queue";

type OfflineQueueItem = {
  userId: string;
  updates: SettingsUpdate;
  timestamp: number;
};

/**
 * Save updates to offline queue for later sync.
 */
function saveToOfflineQueue(userId: string, updates: SettingsUpdate): void {
  try {
    const existing = localStorage.getItem(OFFLINE_QUEUE_KEY);
    const queue: OfflineQueueItem[] = existing ? JSON.parse(existing) : [];

    // Merge with existing queued item for same user, or add new
    const existingIndex = queue.findIndex((item) => item.userId === userId);
    if (existingIndex >= 0) {
      queue[existingIndex].updates = {
        ...queue[existingIndex].updates,
        ...updates,
      };
      queue[existingIndex].timestamp = Date.now();
    } else {
      queue.push({ userId, updates, timestamp: Date.now() });
    }

    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // localStorage not available
  }
}

/**
 * Get and clear offline queue.
 */
function getAndClearOfflineQueue(): OfflineQueueItem[] {
  try {
    const existing = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!existing) return [];

    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    return JSON.parse(existing);
  } catch {
    return [];
  }
}

/**
 * Creates a settings saver instance that handles debouncing, merging,
 * and proper cleanup for user settings persistence.
 */
export function createSettingsSaver() {
  const state: SaveState = {
    pending: null,
    timeoutId: null,
    isSaving: false,
    statusCallbacks: new Set(),
    currentStatus: "idle",
  };

  const supabase = createClient();

  function setStatus(status: SyncStatus): void {
    state.currentStatus = status;
    state.statusCallbacks.forEach((cb) => cb(status));
  }

  /**
   * Performs the actual save to the database.
   * Uses UPDATE for existing rows to avoid overwriting other fields.
   */
  async function performSave(
    userId: string,
    updates: SettingsUpdate
  ): Promise<boolean> {
    // Check if row exists
    const { data: existing } = await supabase
      .from("settings")
      .select("id")
      .eq("user_id", userId)
      .single();

    const payload: Record<string, Json | string> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.gains !== undefined) {
      payload.gains = updates.gains;
    }
    if (updates.volume_settings !== undefined) {
      payload.volume_settings = updates.volume_settings;
    }

    if (existing) {
      // UPDATE only the changed fields (doesn't overwrite other fields)
      const { error } = await supabase
        .from("settings")
        .update(payload)
        .eq("user_id", userId);

      if (error) throw error;
    } else {
      // INSERT new row with defaults
      const { error } = await supabase.from("settings").insert({
        user_id: userId,
        gains: updates.gains ?? [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        volume_settings: updates.volume_settings ?? { master: 70 },
        ...payload,
      });

      if (error) throw error;
    }

    return true;
  }

  /**
   * Check if we're online.
   */
  function isOnline(): boolean {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  }

  /**
   * Attempts to save with retries on failure.
   * Falls back to offline queue if network is unavailable.
   */
  async function saveWithRetry(
    userId: string,
    updates: SettingsUpdate
  ): Promise<boolean> {
    // If offline, queue for later
    if (!isOnline()) {
      saveToOfflineQueue(userId, updates);
      setStatus("pending");
      toast.info("You're offline", {
        description: "Settings will sync when you're back online.",
      });
      return false;
    }

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        await performSave(userId, updates);
        setStatus("saved");
        // Reset to idle after brief "saved" display
        setTimeout(() => {
          if (state.currentStatus === "saved") {
            setStatus("idle");
          }
        }, 1500);
        return true; // Success
      } catch {
        if (attempt < MAX_RETRIES) {
          // Wait before retry (exponential backoff)
          await new Promise((resolve) =>
            setTimeout(resolve, 100 * Math.pow(2, attempt))
          );
        }
      }
    }

    // All retries failed - queue for later if network issue
    if (!isOnline()) {
      saveToOfflineQueue(userId, updates);
      setStatus("pending");
      toast.info("Connection lost", {
        description: "Settings will sync when you're back online.",
      });
      return false;
    }

    // Actual error (not network)
    setStatus("error");
    toast.error("Failed to save settings", {
      description: "Your changes may not be saved. Please try again.",
    });
    return false;
  }

  /**
   * Process any queued offline saves.
   */
  async function processOfflineQueue(): Promise<void> {
    const queue = getAndClearOfflineQueue();
    if (queue.length === 0) return;

    setStatus("saving");

    for (const item of queue) {
      try {
        await performSave(item.userId, item.updates);
      } catch {
        // Re-queue failed items
        saveToOfflineQueue(item.userId, item.updates);
      }
    }

    setStatus("saved");
    setTimeout(() => {
      if (state.currentStatus === "saved") {
        setStatus("idle");
      }
    }, 1500);
  }

  // Listen for online event to process queue
  if (typeof window !== "undefined") {
    window.addEventListener("online", () => {
      processOfflineQueue();
    });

    // Also process queue on creation if online and queue exists
    if (isOnline()) {
      processOfflineQueue();
    }
  }

  /**
   * Schedule a save with debouncing.
   * Merges with any pending updates.
   */
  function save(updates: SettingsUpdate): void {
    // Merge with pending updates
    state.pending = {
      ...state.pending,
      ...updates,
    };

    setStatus("pending");

    // Clear existing timeout
    if (state.timeoutId) {
      clearTimeout(state.timeoutId);
    }

    // Schedule new save
    state.timeoutId = setTimeout(async () => {
      state.timeoutId = null;

      if (!state.pending || state.isSaving) return;

      const updatesToSave = state.pending;
      state.pending = null;
      state.isSaving = true;
      setStatus("saving");

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          state.isSaving = false;
          setStatus("idle");
          return;
        }

        await saveWithRetry(user.id, updatesToSave);
      } finally {
        state.isSaving = false;
      }
    }, DEBOUNCE_MS);
  }

  /**
   * Immediately flush any pending saves.
   * Call this on component unmount to ensure data isn't lost.
   */
  async function flush(): Promise<void> {
    // Clear the timeout
    if (state.timeoutId) {
      clearTimeout(state.timeoutId);
      state.timeoutId = null;
    }

    // If there are pending updates, save them now
    if (state.pending && !state.isSaving) {
      const updatesToSave = state.pending;
      state.pending = null;
      state.isSaving = true;

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await saveWithRetry(user.id, updatesToSave);
        }
      } finally {
        state.isSaving = false;
      }
    }
  }

  /**
   * Cancel any pending saves without flushing.
   */
  function cancel(): void {
    if (state.timeoutId) {
      clearTimeout(state.timeoutId);
      state.timeoutId = null;
    }
    state.pending = null;
  }

  /**
   * Check if there are pending unsaved changes.
   */
  function hasPending(): boolean {
    return state.pending !== null || state.isSaving;
  }

  /**
   * Subscribe to sync status changes.
   * Returns unsubscribe function.
   */
  function onStatusChange(callback: StatusCallback): () => void {
    state.statusCallbacks.add(callback);
    // Immediately notify of current status
    callback(state.currentStatus);
    return () => {
      state.statusCallbacks.delete(callback);
    };
  }

  /**
   * Get current sync status.
   */
  function getStatus(): SyncStatus {
    return state.currentStatus;
  }

  return {
    save,
    flush,
    cancel,
    hasPending,
    onStatusChange,
    getStatus,
  };
}

/**
 * Load user settings from the database.
 * Returns null if user is not authenticated or no settings exist.
 */
export async function loadUserSettings(): Promise<{
  gains: number[];
  volume_settings: { master: number } | null;
} | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("settings")
    .select("gains, volume_settings")
    .eq("user_id", user.id)
    .single();

  if (error || !data) return null;

  return {
    gains: Array.isArray(data.gains) ? (data.gains as number[]) : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    volume_settings: data.volume_settings as { master: number } | null,
  };
}
