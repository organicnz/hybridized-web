"use client";

import { ArrowLeft, Home, Search } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-black to-blue-900 px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
          404
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Page not found</h1>
        <p className="text-purple-200/70 mb-8">
          The page you are looking for doesn&apos;t exist or may have been moved.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-purple-500/50"
          >
            <Home size={18} />
            Back to Home
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-medium transition-all duration-200 border border-white/10"
          >
            <Search size={18} />
            Search Mixes
          </Link>
        </div>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="mt-4 inline-flex items-center gap-2 text-sm text-purple-200/50 hover:text-purple-200 transition-colors"
        >
          <ArrowLeft size={14} />
          Go back
        </button>
      </div>
    </div>
  );
}
