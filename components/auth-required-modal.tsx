"use client";

import { LogIn, X } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export function AuthRequiredModal({
  isOpen,
  onClose,
  message = "Sign in to play music and save your preferences",
}: AuthRequiredModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gradient-to-br from-zinc-900/95 to-black/95 backdrop-blur-2xl border border-white/20 rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 rounded-2xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/10"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-white/70" />
        </button>

        {/* Content */}
        <div className="relative text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-400/30">
              <LogIn className="w-10 h-10 text-purple-400" />
            </div>
          </div>

          <h2 className="text-white font-bold text-2xl mb-3">Login Required</h2>
          <p className="text-white/60 text-base mb-8">{message}</p>

          <div className="flex flex-col gap-3">
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-purple-500/50"
            >
              <LogIn size={20} />
              Sign In
            </Link>

            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-medium transition-all duration-200 border border-white/10"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
