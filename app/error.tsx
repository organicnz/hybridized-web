"use client";

import * as Sentry from "@sentry/nextjs";
import { Home, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  const router = useRouter();
  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
      <div className="glass mx-auto w-full max-w-md rounded-3xl p-10 text-center">
        <div className="gradient-text mb-4 font-display text-7xl font-bold tracking-tight">
          Oops
        </div>
        <h1 className="mb-3 font-display text-2xl font-bold text-foreground">
          Something went wrong
        </h1>
        <p className="mb-2 text-muted-foreground">
          An unexpected error occurred while loading this page.
        </p>
        {isDev && error.message && (
          <p className="mb-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 font-mono text-xs break-words text-destructive">
            {error.message}
            {error.digest ? ` (digest: ${error.digest})` : ""}
          </p>
        )}
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              reset();
              router.refresh();
            }}
            className="btn btn-primary btn-lg w-full sm:w-auto"
          >
            <RefreshCw size={18} />
            Try Again
          </button>
          <Link href="/home" className="btn btn-outline btn-lg w-full sm:w-auto">
            <Home size={18} />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
