"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import {
  Lock,
  Mail,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

const REDIRECT_AFTER_LOGIN = "/home";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [useMagicLink, setUseMagicLink] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#121212]">
      <Link
        href="/home"
        className="fixed top-6 left-6 flex items-center gap-2 text-white/70 hover:text-white transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Back to Home</span>
      </Link>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
            <Image
              src="/logo.png"
              alt="Hybridized Logo"
              width={48}
              height={48}
              className="w-12 h-12 rounded-full group-hover:scale-105 transition-transform"
            />
            <span className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Hybridized
            </span>
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-white/70">
            Sign in to access your musical journey
          </p>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
          {/* Toggle between password and magic link */}
          <div className="flex gap-2 mb-6 p-1 bg-black/30 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setUseMagicLink(false);
                setError(null);
                setMagicLinkSent(false);
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                !useMagicLink
                  ? "bg-green-500 text-white shadow-lg"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Lock className="w-4 h-4 inline mr-2" />
              Password
            </button>
            <button
              type="button"
              onClick={() => {
                setUseMagicLink(true);
                setError(null);
                setMagicLinkSent(false);
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                useMagicLink
                  ? "bg-green-500 text-white shadow-lg"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Sparkles className="w-4 h-4 inline mr-2" />
              Magic Link
            </button>
          </div>

          {error && (
            <div
              className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3"
              role="alert"
            >
              <AlertCircle
                className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {magicLinkSent && (
            <div
              className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-start gap-3"
              role="status"
            >
              <CheckCircle
                className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div>
                <p className="text-green-200 text-sm font-medium mb-1">
                  Magic link sent!
                </p>
                <p className="text-green-200/70 text-xs">
                  Check your email and click the link to sign in. You can close
                  this page.
                </p>
              </div>
            </div>
          )}

          <form
            onSubmit={useMagicLink ? handleMagicLink : handleLogin}
            className="space-y-6"
          >
            <div>
              <label
                htmlFor="email"
                className="block text-white font-medium mb-2"
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50"
                  aria-hidden="true"
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full pl-11 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder:text-white/50 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:border-white/20"
                  placeholder="your@email.com"
                  required
                  aria-required="true"
                />
              </div>
            </div>

            {!useMagicLink && (
              <div>
                <label
                  htmlFor="password"
                  className="block text-white font-medium mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50"
                    aria-hidden="true"
                  />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="w-full pl-11 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder:text-white/50 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:border-white/20"
                    placeholder="••••••••"
                    required
                    aria-required="true"
                  />
                </div>
              </div>
            )}

            {useMagicLink && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <p className="text-white/80 text-sm">
                  <Sparkles className="w-4 h-4 inline mr-2 text-green-400" />
                  We'll send you a magic link to sign in without a password
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || magicLinkSent}
              className="w-full px-6 py-3 bg-green-500 text-white rounded-full font-semibold hover:bg-green-600 hover:scale-105 transition-all shadow-lg shadow-green-500/50 disabled:opacity-50 disabled:hover:scale-100"
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
            <div className="mt-6 text-center">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-white/70 hover:text-white hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-white/50 mt-6">
          Don't have an account?{" "}
          <Link
            href="/auth/signup"
            className="text-green-400 hover:text-green-300 hover:underline font-semibold transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
