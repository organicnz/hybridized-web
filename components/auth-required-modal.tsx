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
        className="absolute inset-0 animate-in cursor-default bg-black/60 backdrop-blur-sm duration-200 fade-in"
        onClick={requestClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") requestClose();
        }}
      />

      {/* Modal */}
      <div className="relative mx-4 w-full max-w-md animate-in rounded-2xl border border-white/20 bg-linear-to-br from-zinc-900/95 to-black/95 p-8 shadow-2xl backdrop-blur-2xl duration-200 zoom-in-95">
        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-br from-purple-500/10 via-transparent to-blue-500/10" />

        {/* Close button */}
        <button
          type="button"
          onClick={requestClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-colors hover:bg-white/10"
          aria-label="Close"
        >
          <X className="h-4 w-4 text-white/70" />
        </button>

        {/* Content */}
        <div className="relative text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-purple-400/30 bg-linear-to-br from-purple-500/20 to-pink-500/20">
              <LogIn className="h-10 w-10 text-purple-400" />
            </div>
          </div>

          <h2 id="auth-required-title" className="mb-3 text-2xl font-bold text-white">
            Login Required
          </h2>
          <p className="mb-8 text-base text-white/60">{message}</p>

          <div className="flex flex-col gap-3">
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-purple-500 to-pink-500 px-6 py-3 font-medium text-white shadow-lg transition-all duration-200 hover:from-purple-600 hover:to-pink-600 hover:shadow-purple-500/50"
            >
              <LogIn size={20} />
              Sign In
            </Link>

            <button
              type="button"
              onClick={requestClose}
              className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-medium text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
