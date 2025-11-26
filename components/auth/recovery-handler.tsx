"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Universal recovery token handler
 * Detects recovery tokens in URL hash on ANY page and redirects to reset password
 * This handles cases where old reset emails have different redirect URLs
 */
export function RecoveryHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // Check if we're already on an auth page (avoid redirect loops)
    if (pathname.startsWith("/auth/")) {
      console.log("RecoveryHandler: On auth page, skipping");
      return;
    }

    // Check for recovery tokens in URL hash
    const hash = window.location.hash;
    if (!hash) {
      console.log("RecoveryHandler: No hash in URL");
      return;
    }

    const hashParams = new URLSearchParams(hash.substring(1));
    const type = hashParams.get("type");
    const accessToken = hashParams.get("access_token");

    console.log("RecoveryHandler: Detected hash", {
      type,
      hasAccessToken: !!accessToken,
      pathname,
    });

    // If this is a recovery link, redirect to reset password page
    if (type === "recovery" && accessToken) {
      console.log(
        "RecoveryHandler: Recovery token detected, redirecting to reset password...",
      );
      router.replace(`/auth/reset-password${hash}`);
    }
  }, [pathname, router]);

  return null; // This component doesn't render anything
}
