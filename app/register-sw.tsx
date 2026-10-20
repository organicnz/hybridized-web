"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      // First, unregister all old service workers
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }

        // Then register the new one after a short delay
        setTimeout(() => {
          navigator.serviceWorker
            .register("/sw.js")
            .then(() => {})
            .catch((error) => {
              console.error("Service Worker registration failed:", error);
            });
        }, 100);
      });
    }
  }, []);

  return null;
}
