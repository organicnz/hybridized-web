"use client";

import { useState, useEffect } from "react";
import type { SyncStatus } from "@/lib/settings-utils";

type SettingsSaver = {
  onStatusChange: (callback: (status: SyncStatus) => void) => () => void;
  getStatus: () => SyncStatus;
};

/**
 * Hook to subscribe to settings sync status changes.
 */
export function useSyncStatus(
  saverRef: React.RefObject<SettingsSaver | null>
): SyncStatus {
  const [status, setStatus] = useState<SyncStatus>("idle");

  useEffect(() => {
    const saver = saverRef.current;
    if (!saver) return;

    const unsubscribe = saver.onStatusChange(setStatus);
    return unsubscribe;
  }, [saverRef]);

  return status;
}
