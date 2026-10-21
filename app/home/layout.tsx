"use client";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Suspense } from "react";

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    // `h-dvh`, not `h-screen`: `100vh` includes the area behind the mobile
    // browser chrome, which puts the pinned footer below the fold and the
    // last episode out of reach. `100dvh` is the viewport actually visible.
    <div className="flex h-dvh flex-col overflow-hidden">
      <Header />
      {/* `min-h-0` lets this pane shrink below its content, so the pane
          scrolls instead of being clipped by the shell's `overflow-hidden`. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}
