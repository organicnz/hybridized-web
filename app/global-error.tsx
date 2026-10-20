"use client";

import * as Sentry from "@sentry/nextjs";
import { RefreshCw } from "lucide-react";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-linear-to-br from-purple-900 via-black to-blue-900 px-4">
        <div className="max-w-md text-center">
          <div className="mb-4 bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-7xl font-black text-transparent">
            Oops
          </div>
          <h1 className="mb-3 text-2xl font-bold text-white">Something went wrong</h1>
          <p className="mb-8 text-purple-200/70">A critical error occurred. Please try again.</p>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-purple-500 to-pink-500 px-6 py-3 font-medium text-white shadow-lg transition-all duration-200 hover:from-purple-600 hover:to-pink-600 hover:shadow-purple-500/50"
          >
            <RefreshCw size={18} />
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
