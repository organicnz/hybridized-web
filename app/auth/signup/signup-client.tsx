"use client";

import { AuthAlert, AuthField, AuthShell, authInputClass } from "@/components/auth/auth-shell";
import { getSupabase } from "@/lib/supabase/client";
import { CheckCircle, Lock, Mail, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const _router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = await getSupabase();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
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
      <AuthShell title="Check Your Email" subtitle="One more step to join the journey">
        <div className="p-2 text-center">
          <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/30">
            <CheckCircle className="h-8 w-8 text-emerald-500" aria-hidden="true" />
          </span>
          <p className="mb-6 text-muted-foreground">
            We&apos;ve sent you a confirmation email. Please check your inbox and click the link to
            verify your account.
          </p>
          <Link href="/auth/login" className="btn btn-primary btn-lg w-full">
            Go to Login
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create Account"
      subtitle="Join the musical journey"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/auth/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      {error && <AuthAlert variant="error">{error}</AuthAlert>}

      <form onSubmit={handleSignup} className="space-y-5">
        <AuthField
          label="Full Name"
          htmlFor="fullName"
          icon={<User className="h-5 w-5" aria-hidden="true" />}
        >
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={loading}
            className={authInputClass}
            placeholder="John Doe"
            required
          />
        </AuthField>

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

        <AuthField
          label="Password"
          htmlFor="password"
          icon={<Lock className="h-5 w-5" aria-hidden="true" />}
          hint={<p className="mt-1.5 text-xs text-muted-foreground">Minimum 6 characters</p>}
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

        <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </form>
    </AuthShell>
  );
}
