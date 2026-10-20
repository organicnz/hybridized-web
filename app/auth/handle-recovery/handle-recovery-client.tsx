"use client";

import { AuthShell } from "@/components/auth/auth-shell";
import { withHash } from "@/lib/utils/route";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function HandleRecoveryPage() {
  const router = useRouter();

  useEffect(() => {
    // Get the hash from the URL
    const hash = window.location.hash;

    // Redirect to reset password page with the hash
    router.replace(withHash("/auth/reset-password", hash));
  }, [router]);

  return (
    <AuthShell title="Account Recovery" subtitle="Redirecting you to password reset...">
      <div className="p-2 text-center">
        <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Processing your reset link...</p>
      </div>
    </AuthShell>
  );
}
