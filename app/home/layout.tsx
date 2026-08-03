"use client";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col bg-[#121212] overflow-hidden">
      <Header />
      <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
      <Footer />
    </div>
  );
}
