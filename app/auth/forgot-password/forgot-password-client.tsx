"use client";

import { AuthAlert, AuthField, AuthShell, authInputClass } from "@/components/auth/auth-shell";
import { getSupabase } from "@/lib/supabase/client";
import { CheckCircle, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = await getSupabase();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/handle-recovery`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthShell
        title="Check Your Email"
        subtitle="Reset link on its way"
        backHref="/auth/login"
        backLabel="Back to Login"
      >
        <div className="p-2 text-center">
          <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/30">
            <CheckCircle className="h-8 w-8 text-emerald-500" aria-hidden="true" />
          </span>
          <p className="mb-6 text-muted-foreground">
            We&apos;ve sent you a password reset link. Please check your inbox and follow the
            instructions.
          </p>
          <Link href="/auth/login" className="btn btn-primary btn-lg w-full">
            Back to Login
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset Password"
      subtitle="Enter your email to receive a reset link"
      backHref="/auth/login"
      backLabel="Back to Login"
    >
      {error && <AuthAlert variant="error">{error}</AuthAlert>}

      <form onSubmit={handleResetPassword} className="space-y-5">
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

        <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>
    </AuthShell>
  );
}
