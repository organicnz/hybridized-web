"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      // First, unregister all old service workers
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
        });

        // Then register the new one after a short delay
        setTimeout(() => {
          navigator.serviceWorker
            .register("/sw.js")
            .then((registration) => {
              console.log("Service Worker registered:", registration);
            })
            .catch((error) => {
              console.error("Service Worker registration failed:", error);
            });
        }, 100);
      });
    }
  }, []);

  return null;
}
