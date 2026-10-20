"use client";

import { cn } from "@/lib/utils";
import { AlertCircle, ArrowLeft, CheckCircle } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  subtitle?: string;
  backHref?: Route;
  backLabel?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({
  title,
  subtitle,
  backHref = "/home",
  backLabel = "Back to Home",
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <Link
        href={backHref}
        className="fixed left-6 top-6 z-10 flex items-center gap-2 rounded-lg bg-card/70 px-3 py-2 text-sm text-muted-foreground ring-1 ring-border backdrop-blur-md transition-all hover:text-foreground group"
      >
        <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
        <span className="font-medium">{backLabel}</span>
      </Link>

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="mb-6 inline-flex items-center gap-3 group">
            <Image
              src="/logo.png"
              alt="Hybridized Logo"
              width={48}
              height={48}
              className="h-12 w-12 rounded-xl ring-1 ring-border transition-transform duration-300 group-hover:scale-105"
              priority
            />
            <span className="gradient-text font-display text-3xl font-bold tracking-tight">
              Hybridized
            </span>
          </Link>
          <h1 className="mb-2 font-display text-4xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>

        <div className="glass rounded-2xl p-6 sm:p-8">{children}</div>

        {footer && <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>}
      </div>
    </div>
  );
}

export function AuthAlert({
  variant,
  children,
}: {
  variant: "error" | "success";
  children: ReactNode;
}) {
  const isError = variant === "error";
  return (
    <div
      className={cn(
        "mb-6 flex items-start gap-3 rounded-xl border p-4",
        isError
          ? "border-destructive/30 bg-destructive/10"
          : "border-emerald-500/30 bg-emerald-500/10",
      )}
      role={isError ? "alert" : "status"}
    >
      {isError ? (
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
      ) : (
        <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" aria-hidden="true" />
      )}
      <div className={cn("text-sm", isError ? "text-destructive" : "text-foreground")}>
        {children}
      </div>
    </div>
  );
}

export function AuthField({
  label,
  htmlFor,
  icon,
  children,
  hint,
}: {
  label: string;
  htmlFor: string;
  icon?: ReactNode;
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label mb-2 block">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
        {children}
      </div>
      {hint}
    </div>
  );
}

export const authInputClass = "input pl-10";
