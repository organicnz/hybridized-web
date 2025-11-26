"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle, AlertCircle, Loader2, ArrowRight } from "lucide-react";

export default function ConfirmEmailPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [countdown, setCountdown] = useState(5);
  const router = useRouter();

  useEffect(() => {
    // Check URL for success/error indicators from callback
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    const confirmed = params.get("confirmed");

    if (error) {
      setStatus("error");
    } else if (confirmed === "true") {
      setStatus("success");

      // Start countdown
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push("/home");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else {
      // If no params, assume success (came from email link)
      setStatus("success");
    }
  }, [router]);

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
        </div>

        {status === "loading" && (
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-8 text-center">
            <Loader2 className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Confirming Email
            </h2>
            <p className="text-purple-200/70">
              Please wait while we verify your email address...
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 backdrop-blur-sm rounded-2xl border border-green-500/20 p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Email Confirmed!
            </h2>
            <p className="text-purple-200/70 mb-6">
              Your email has been successfully verified. You can now access all
              features of Hybridized.
            </p>
            <div className="space-y-3">
              <Link
                href="/home"
                className="block w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold hover:scale-105 transition-all shadow-lg shadow-purple-500/50"
              >
                Go to Home
                <ArrowRight className="w-5 h-5 inline ml-2" />
              </Link>
              <p className="text-sm text-purple-200/50">
                Redirecting automatically in {countdown} seconds...
              </p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 backdrop-blur-sm rounded-2xl border border-red-500/20 p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Confirmation Failed
            </h2>
            <p className="text-purple-200/70 mb-6">
              We couldn't verify your email. The link may have expired or
              already been used.
            </p>
            <div className="space-y-3">
              <Link
                href="/auth/signup"
                className="block w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold hover:scale-105 transition-all shadow-lg shadow-purple-500/50"
              >
                Try Signing Up Again
              </Link>
              <Link
                href="/auth/login"
                className="block text-sm text-purple-400 hover:text-pink-400 hover:underline transition-colors"
              >
                Already have an account? Sign in
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
