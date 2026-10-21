"use client";

import { SERVICE_WORKER_DISABLED_KEY, SERVICE_WORKER_URL } from "@/lib/service-worker";
import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // A visitor who has turned the worker off keeps it off. The flag is set
    // by `/unregister-sw.js`, which is the page to visit for that.
    if (localStorage.getItem(SERVICE_WORKER_DISABLED_KEY) === "1") {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
      return;
    }

    // First, unregister all old service workers
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }

      // Then register the new one after a short delay
      setTimeout(() => {
        navigator.serviceWorker
          .register(SERVICE_WORKER_URL)
          .then(() => {})
          .catch((error) => {
            console.error("Service Worker registration failed:", error);
          });
      }, 100);
    });
  }, []);

  return null;
}
