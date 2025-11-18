"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { Lock, Mail, AlertCircle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const REDIRECT_AFTER_LOGIN = "/home";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      router.push(REDIRECT_AFTER_LOGIN);
      router.refresh();
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
              className="w-12 h-12 rounded-lg group-hover:scale-105 transition-transform"
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
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3" role="alert">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-white font-medium mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full pl-11 pr-4 py-3 bg-[#181818] border border-white/10 rounded-lg text-white placeholder:text-white/50 focus:border-[#1DB954] focus:outline-none focus:ring-2 focus:ring-[#1DB954]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:border-white/20"
                  placeholder="your@email.com"
                  required
                  aria-required="true"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-white font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" aria-hidden="true" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full pl-11 pr-4 py-3 bg-[#181818] border border-white/10 rounded-lg text-white placeholder:text-white/50 focus:border-[#1DB954] focus:outline-none focus:ring-2 focus:ring-[#1DB954]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:border-white/20"
                  placeholder="••••••••"
                  required
                  aria-required="true"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-[#1DB954] text-black rounded-full font-semibold hover:scale-105 hover:bg-[#1ed760] transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/auth/forgot-password" className="text-sm text-white/70 hover:text-white hover:underline transition-colors">
              Forgot password?
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-white/50 mt-6">
          Don't have an account?{" "}
          <Link href="/auth/signup" className="text-[#1DB954] hover:text-[#1ed760] hover:underline font-semibold transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
