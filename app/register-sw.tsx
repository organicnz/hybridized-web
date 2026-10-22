"use client";

import { SERVICE_WORKER_DISABLED_KEY, SERVICE_WORKER_URL } from "@/lib/service-worker";
import { useEffect } from "react";

/**
 * Unregister every service worker this origin has.
 *
 * The failures are swallowed on purpose: the worker may already be gone, or
 * the browser may refuse the request, and neither is worth failing the page
 * over. The point of the call is the unregistering, not the reporting.
 */
async function unregisterAll(): Promise<void> {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  } catch (error) {
    console.error("Service Worker cleanup failed:", error);
  }
}

export function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // A visitor who has turned the worker off keeps it off. The flag is set
    // by `/unregister-sw.js`, which is the page to visit for that.
    if (localStorage.getItem(SERVICE_WORKER_DISABLED_KEY) === "1") {
      void unregisterAll();
      return;
    }

    // First, unregister all old service workers
    void unregisterAll().then(() => {
      // Then register the new one after a short delay
      setTimeout(() => {
        navigator.serviceWorker.register(SERVICE_WORKER_URL).catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
      }, 100);
    });
  }, []);

  return null;
}
