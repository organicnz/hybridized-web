import { AppShell } from "@/components/app-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms of service for Hybridized.",
};

export default function TermsPage() {
  return (
    <AppShell>
      <div className="container mx-auto px-4 py-10 md:py-12 max-w-3xl">
        <h1 className="text-4xl font-black mb-6">Terms</h1>
        <p className="text-muted-foreground">Terms of service content.</p>
      </div>
    </AppShell>
  );
}
