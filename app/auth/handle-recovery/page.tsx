"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function HandleRecoveryPage() {
  const router = useRouter();

  useEffect(() => {
    // Get the hash from the URL
    const hash = window.location.hash;
    
    // Redirect to reset password page with the hash
    router.replace(`/auth/reset-password${hash}`);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-black to-blue-900">
      <div className="w-full max-w-md">
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-8 text-center">
          <Loader2 className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold text-white mb-2">
            Processing Reset Link
          </h2>
          <p className="text-purple-200/70">
            Redirecting you to password reset...
          </p>
        </div>
      </div>
    </div>
  );
}
