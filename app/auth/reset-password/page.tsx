"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { Lock, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [validSession, setValidSession] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const handleRecoveryToken = async () => {
      // Check if we have a recovery token in the URL hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const type = hashParams.get("type");

      console.log("Recovery handler - type:", type, "has token:", !!accessToken);

      if (type === "recovery" && accessToken && refreshToken) {
        try {
          // Exchange the recovery token for a session
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          console.log("setSession result:", { data, error });

          if (error) {
            console.error("setSession error:", error);
            setError(
              "Invalid or expired reset link. Please request a new one.",
            );
            setVerifying(false);
          } else if (data.session) {
            console.log("Session established successfully");
            setValidSession(true);
            setVerifying(false);
            // Clean up the URL
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname,
            );
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
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          console.log("Existing session found");
          setValidSession(true);
        } else {
          console.log("No session or recovery token found");
          setError(
            "No valid reset link found. Please request a new password reset.",
          );
        }
        setVerifying(false);
      }
    };

    handleRecoveryToken();
  }, [supabase.auth]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

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
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-black to-blue-900">
        <div className="w-full max-w-md">
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-8 text-center">
            <Loader2 className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Verifying Reset Link
            </h2>
            <p className="text-purple-200/70">
              Please wait while we verify your password reset link...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-black to-blue-900">
        <div className="w-full max-w-md">
          <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 backdrop-blur-sm rounded-2xl border border-green-500/20 p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Password Updated
            </h2>
            <p className="text-purple-200/70 mb-6">
              Your password has been successfully updated. Redirecting to
              login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!validSession) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-black to-blue-900">
        <div className="w-full max-w-md">
          <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 backdrop-blur-sm rounded-2xl border border-red-500/20 p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Invalid Reset Link
            </h2>
            <p className="text-purple-200/70 mb-6">
              {error ||
                "This password reset link is invalid or has expired. Please request a new one."}
            </p>
            <Link
              href="/auth/forgot-password"
              className="inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold hover:scale-105 transition-all shadow-lg shadow-purple-500/50"
            >
              Request New Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-black to-blue-900">
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
            <span className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Hybridized
            </span>
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">New Password</h1>
          <p className="text-purple-200/70">Enter your new password</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-8">
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

          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div>
              <label
                htmlFor="password"
                className="block text-white font-medium mb-2"
              >
                New Password
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
                  className="w-full pl-11 pr-4 py-3 bg-black/30 border border-purple-500/30 rounded-lg text-white placeholder:text-purple-300/50 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:border-purple-500/50"
                  placeholder="••••••••"
                  required
                  aria-required="true"
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-white font-medium mb-2"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50"
                  aria-hidden="true"
                />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="w-full pl-11 pr-4 py-3 bg-black/30 border border-purple-500/30 rounded-lg text-white placeholder:text-purple-300/50 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:border-purple-500/50"
                  placeholder="••••••••"
                  required
                  aria-required="true"
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold hover:scale-105 transition-all shadow-lg shadow-purple-500/50 disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
