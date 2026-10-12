"use client";

import { Coffee, Heart } from "lucide-react";

import { cn } from "@/lib/utils";

export function DonationClient() {
  return (
    <div className="section-container py-24">
      <div className="mx-auto max-w-4xl">
        {/* Hero Section */}
        <div className="mb-12 text-center md:mb-16">
          <Heart className="mx-auto mb-6 h-20 w-20 fill-pink-500/15 text-pink-500 gpu-opacity" />
          <h1 className="gradient-text mb-6 font-display text-fluid-2xl font-bold tracking-tight">
            Support Hybridized
          </h1>
          <p className="mx-auto max-w-3xl text-xl leading-relaxed text-muted-foreground md:text-2xl">
            Help us continue creating innovative musical experiences and discovering unique hybrid
            sounds
          </p>
        </div>

        {/* Support CTA */}
        <div className={cn("glass p-10 text-center md:p-12")}>
          <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            Hybridized is free to use and ad-free. If you enjoy the music, consider buying us a
            coffee to help keep the archive online.
          </p>
          <a
            href="https://ko-fi.com/organicnz"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-lg inline-flex items-center gap-3 rounded-full shadow-glow"
          >
            <Coffee className="h-6 w-6" aria-hidden="true" />
            Support on Ko-fi
          </a>
        </div>
      </div>
    </div>
  );
}
