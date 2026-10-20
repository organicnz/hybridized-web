"use client";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Suspense } from "react";

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}
