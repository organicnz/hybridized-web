"use client";

import { AuthShell } from "@/components/auth/auth-shell";
import { AlertCircle, ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function ConfirmEmailPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [countdown, setCountdown] = useState(5);
  const router = useRouter();

  useEffect(() => {
    // Check URL for success/error indicators from callback
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    const confirmed = params.get("confirmed");

    if (error) {
      setStatus("error");
    } else if (confirmed === "true") {
      setStatus("success");

      // Start countdown
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push("/home");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else {
      // If no params, assume success (came from email link)
      setStatus("success");
    }
  }, [router]);

  return (
    <AuthShell title="Confirm Email" subtitle="Verifying your address">
      {status === "loading" && (
        <div className="p-2 text-center">
          <Loader2
            className="mx-auto mb-4 h-12 w-12 animate-spin text-primary"
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground">
            Please wait while we verify your email address...
          </p>
        </div>
      )}

      {status === "success" && (
        <div className="p-2 text-center">
          <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/30">
            <CheckCircle className="h-8 w-8 text-emerald-500" aria-hidden="true" />
          </span>
          <h2 className="mb-2 font-display text-2xl font-bold text-foreground">Email Confirmed!</h2>
          <p className="mb-6 text-muted-foreground">
            Your email has been successfully verified. You can now access all features of
            Hybridized.
          </p>
          <div className="space-y-3">
            <Link href="/home" className="btn btn-primary btn-lg w-full">
              Go to Home
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <p className="text-sm text-muted-foreground">
              Redirecting automatically in {countdown} seconds...
            </p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="p-2 text-center">
          <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 ring-1 ring-destructive/30">
            <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
          </span>
          <h2 className="mb-2 font-display text-2xl font-bold text-foreground">
            Confirmation Failed
          </h2>
          <p className="mb-6 text-muted-foreground">
            We couldn&apos;t verify your email. The link may have expired or already been used.
          </p>
          <div className="space-y-3">
            <Link href="/auth/signup" className="btn btn-primary btn-lg w-full">
              Try Signing Up Again
            </Link>
            <Link
              href="/auth/login"
              className="block text-sm font-medium text-primary hover:underline"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
