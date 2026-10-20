"use client";

import { AuthAlert, AuthField, AuthShell, authInputClass } from "@/components/auth/auth-shell";
import { getSupabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Lock, Mail, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const REDIRECT_AFTER_LOGIN = "/home";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [useMagicLink, setUseMagicLink] = useState(false);
  const _router = useRouter();
  const searchParams = useSearchParams();

  // Surface auth callback errors (e.g. expired confirmation links)
  useEffect(() => {
    if (searchParams.get("error") === "auth_callback_failed") {
      setError("Your sign-in link is invalid or has expired. Please try again.");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = await getSupabase();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Get redirect URL from query params or use default
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get("redirectTo") || REDIRECT_AFTER_LOGIN;

      // Force a hard refresh to ensure session is properly loaded
      window.location.href = redirectTo;
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMagicLinkSent(false);

    const supabase = await getSupabase();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${REDIRECT_AFTER_LOGIN}`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setMagicLinkSent(true);
      setLoading(false);
    }
  };

  const switchMode = (magic: boolean) => {
    setUseMagicLink(magic);
    setError(null);
    setMagicLinkSent(false);
  };

  return (
    <AuthShell
      title="Welcome Back"
      subtitle="Sign in to access your musical journey"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="font-semibold text-primary hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      {/* Toggle between password and magic link */}
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1" role="tablist">
        {(
          [
            { magic: false, label: "Password", Icon: Lock },
            { magic: true, label: "Magic Link", Icon: Sparkles },
          ] as const
        ).map(({ magic, label, Icon }) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={useMagicLink === magic}
            onClick={() => switchMode(magic)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              useMagicLink === magic
                ? "bg-card text-foreground shadow-card"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {error && <AuthAlert variant="error">{error}</AuthAlert>}

      {magicLinkSent && (
        <AuthAlert variant="success">
          <p className="mb-1 font-medium">Magic link sent!</p>
          <p className="text-xs text-muted-foreground">
            Check your email and click the link to sign in. You can close this page.
          </p>
        </AuthAlert>
      )}

      <form onSubmit={useMagicLink ? handleMagicLink : handleLogin} className="space-y-5">
        <AuthField
          label="Email"
          htmlFor="email"
          icon={<Mail className="h-5 w-5" aria-hidden="true" />}
        >
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className={authInputClass}
            placeholder="your@email.com"
            required
          />
        </AuthField>

        {!useMagicLink && (
          <AuthField
            label="Password"
            htmlFor="password"
            icon={<Lock className="h-5 w-5" aria-hidden="true" />}
          >
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className={authInputClass}
              placeholder="••••••••"
              required
            />
          </AuthField>
        )}

        {useMagicLink && (
          <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              We&apos;ll send you a magic link to sign in without a password
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || magicLinkSent}
          className="btn btn-primary btn-lg w-full"
        >
          {loading
            ? useMagicLink
              ? "Sending magic link..."
              : "Signing in..."
            : useMagicLink
              ? "Send Magic Link"
              : "Sign In"}
        </button>
      </form>

      {!useMagicLink && (
        <div className="mt-5 text-center">
          <Link
            href="/auth/forgot-password"
            className="rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground hover:underline"
          >
            Forgot password?
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
