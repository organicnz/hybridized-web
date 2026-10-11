"use client";

import { Home, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  const router = useRouter();
  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-black to-blue-900 px-4">
      <div className="text-center max-w-md">
        <div className="text-7xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
          Oops
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Something went wrong</h1>
        <p className="text-purple-200/70 mb-2">
          An unexpected error occurred while loading this page.
        </p>
        {isDev && error.message && (
          <p className="text-xs text-red-300/80 font-mono bg-black/30 rounded-lg px-3 py-2 mb-2 break-words">
            {error.message}
            {error.digest ? ` (digest: ${error.digest})` : ""}
          </p>
        )}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
          <button
            type="button"
            onClick={() => {
              reset();
              router.refresh();
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-purple-500/50"
          >
            <RefreshCw size={18} />
            Try Again
          </button>
          <Link
            href="/home"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-medium transition-all duration-200 border border-white/10"
          >
            <Home size={18} />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
