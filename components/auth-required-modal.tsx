"use client";

import { LogIn, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";

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
  const dialogRef = useRef<HTMLDialogElement>(null);

  const requestClose = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  // Sync the native dialog element with the isOpen prop
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Notify the parent when the dialog closes (Escape key or backdrop click)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  // Lock body scroll while open
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

  // The dialog element must not be rendered at all while closed. A `display`
  // utility on <dialog> overrides the UA's `dialog:not([open]) { display: none }`,
  // which would leave an invisible-but-clickable overlay across the page.
  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-[100] m-0 flex h-full w-full items-center justify-center bg-transparent p-0"
      aria-labelledby="auth-required-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={requestClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") requestClose();
        }}
      />

      {/* Modal */}
      <div className="relative bg-linear-to-br from-zinc-900/95 to-black/95 backdrop-blur-2xl border border-white/20 rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-br from-purple-500/10 via-transparent to-blue-500/10 rounded-2xl pointer-events-none" />

        {/* Close button */}
        <button
          type="button"
          onClick={requestClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/10"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-white/70" />
        </button>

        {/* Content */}
        <div className="relative text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 rounded-full bg-linear-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-400/30">
              <LogIn className="w-10 h-10 text-purple-400" />
            </div>
          </div>

          <h2 id="auth-required-title" className="text-white font-bold text-2xl mb-3">
            Login Required
          </h2>
          <p className="text-white/60 text-base mb-8">{message}</p>

          <div className="flex flex-col gap-3">
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-purple-500/50"
            >
              <LogIn size={20} />
              Sign In
            </Link>

            <button
              type="button"
              onClick={requestClose}
              className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-medium transition-all duration-200 border border-white/10"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
