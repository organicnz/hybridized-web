"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Heart } from "lucide-react";

export default function DonationPage() {
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
              Help us continue creating innovative musical experiences and
              discovering unique hybrid sounds
            </p>
          </div>

          {/* Ko-fi Embed */}
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-8 md:p-12 gpu-filter">
            <div className="max-w-2xl mx-auto">
              <iframe
                id="kofiframe"
                src="https://ko-fi.com/organicnz/?hidefeed=true&widget=true&embed=true&preview=true"
                style={{
                  border: "none",
                  width: "100%",
                  padding: "4px",
                  background: "transparent",
                }}
                height="712"
                title="organicnz"
              ></iframe>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
