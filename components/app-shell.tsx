import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Suspense } from "react";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main id="main-content" className="w-full flex-1 scroll-mt-20 pb-28">
        {children}
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}
