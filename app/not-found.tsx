"use client";

import { ArrowLeft, Home, Search } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
      <div className="glass mx-auto w-full max-w-md rounded-3xl p-10 text-center">
        <div className="gradient-text mb-4 font-display text-8xl font-bold tracking-tight">404</div>
        <h1 className="mb-3 font-display text-2xl font-bold text-foreground">Page not found</h1>
        <p className="mb-8 text-muted-foreground">
          The page you are looking for doesn&apos;t exist or may have been moved.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/home" className="btn btn-primary btn-lg w-full sm:w-auto">
            <Home size={18} />
            Back to Home
          </Link>
          <Link href="/search" className="btn btn-outline btn-lg w-full sm:w-auto">
            <Search size={18} />
            Search Mixes
          </Link>
        </div>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="mt-4 inline-flex items-center gap-2 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={14} />
          Go back
        </button>
      </div>
    </div>
  );
}
