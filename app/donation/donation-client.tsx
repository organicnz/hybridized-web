"use client";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Coffee, Heart } from "lucide-react";
import { Suspense } from "react";

export function DonationPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#121212]">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <Heart className="w-20 h-20 text-green-400 mx-auto mb-6 animate-pulse gpu-opacity" />
            <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-6">
              Support Hybridized
            </h1>
            <p className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto leading-relaxed">
              Help us continue creating innovative musical experiences and discovering unique hybrid
              sounds
            </p>
          </div>

          {/* Support CTA */}
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-8 md:p-12 gpu-filter text-center">
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-8 leading-relaxed">
              Hybridized is free to use and ad-free. If you enjoy the music, consider buying us a
              coffee to help keep the archive online.
            </p>
            <a
              href="https://ko-fi.com/organicnz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 px-8 py-4 text-lg font-bold text-black shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <Coffee className="w-6 h-6" aria-hidden="true" />
              Support on Ko-fi
            </a>
          </div>
        </div>
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}
