"use client";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Coffee, Heart } from "lucide-react";
import { Suspense } from "react";
import { cn } from "@/lib/utils";

export function DonationPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <Heart className="w-20 h-20 text-primary mx-auto mb-6 animate-pulse gpu-opacity" />
            <h1 className="text-fluid-2xl font-black bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent mb-6">
              Support Hybridized
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Help us continue creating innovative musical experiences and discovering unique hybrid
              sounds
            </p>
          </div>

          {/* Support CTA */}
          <div className={cn("card-floating text-center")}>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              Hybridized is free to use and ad-free. If you enjoy the music, consider buying us a
              coffee to help keep the archive online.
            </p>
            <a
              href="https://ko-fi.com/organicnz"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-lg inline-flex items-center gap-3 rounded-full shadow-lg hover:scale-105 focus-ring"
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
