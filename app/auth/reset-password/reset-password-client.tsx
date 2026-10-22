"use client";

import { AuthAlert, AuthField, AuthShell, authInputClass } from "@/components/auth/auth-shell";
import { getSupabase } from "@/lib/supabase/client";
import { AlertCircle, CheckCircle, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [validSession, setValidSession] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleRecoveryToken = async () => {
      // Check if we have a recovery token in the URL hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const type = hashParams.get("type");

      if (type === "recovery" && accessToken && refreshToken) {
        try {
          // Exchange the recovery token for a session
          const supabase = await getSupabase();
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error("setSession error:", error);
            setError("Invalid or expired reset link. Please request a new one.");
            setVerifying(false);
          } else if (data.session) {
            setValidSession(true);
            setVerifying(false);
            // Clean up the URL
            window.history.replaceState({}, document.title, window.location.pathname);
          } else {
            setError("Failed to establish session. Please try again.");
            setVerifying(false);
          }
        } catch (err) {
          console.error("Exception during setSession:", err);
          setError("An error occurred. Please try again.");
          setVerifying(false);
        }
      } else {
        // Check if user already has a valid session
        try {
          const supabase = await getSupabase();
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session) {
            setValidSession(true);
          } else {
            setError("No valid reset link found. Please request a new password reset.");
          }
        } catch (err) {
          console.error("Exception during getSession:", err);
          setError("An error occurred. Please try again.");
        }
        setVerifying(false);
      }
    };

    void handleRecoveryToken();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    const supabase = await getSupabase();
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    }
  };

  if (verifying) {
    return (
      <AuthShell title="Verifying Reset Link" subtitle="Please wait a moment...">
        <div className="p-2 text-center">
          <Loader2
            className="mx-auto mb-2 h-12 w-12 animate-spin text-primary"
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground">Verifying your password reset link...</p>
        </div>
      </AuthShell>
    );
  }

  if (success) {
    return (
      <AuthShell title="Password Updated" subtitle="All set — redirecting to login...">
        <div className="p-2 text-center">
          <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/30">
            <CheckCircle className="h-8 w-8 text-emerald-500" aria-hidden="true" />
          </span>
          <p className="text-muted-foreground">
            Your password has been successfully updated. Redirecting to login...
          </p>
        </div>
      </AuthShell>
    );
  }

  if (!validSession) {
    return (
      <AuthShell title="Invalid Reset Link" subtitle="This link didn't check out">
        <div className="p-2 text-center">
          <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 ring-1 ring-destructive/30">
            <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
          </span>
          <p className="mb-6 text-muted-foreground">
            {error ||
              "This password reset link is invalid or has expired. Please request a new one."}
          </p>
          <Link href="/auth/forgot-password" className="btn btn-primary btn-lg w-full">
            Request New Link
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="New Password" subtitle="Enter your new password">
      {error && <AuthAlert variant="error">{error}</AuthAlert>}

      <form onSubmit={handleUpdatePassword} className="space-y-5">
        <AuthField
          label="New Password"
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
            minLength={6}
          />
        </AuthField>

        <AuthField
          label="Confirm Password"
          htmlFor="confirmPassword"
          icon={<Lock className="h-5 w-5" aria-hidden="true" />}
        >
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            className={authInputClass}
            placeholder="••••••••"
            required
            minLength={6}
          />
        </AuthField>

        <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </AuthShell>
  );
}
