import { AppShell } from "@/components/app-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Privacy policy for Hybridized.",
};

export default function PrivacyPage() {
  return (
    <AppShell>
      <div className="container mx-auto px-4 py-10 md:py-12 max-w-3xl">
        <h1 className="text-4xl font-black mb-6">Privacy</h1>
        <p className="text-muted-foreground">Privacy policy content.</p>
      </div>
    </AppShell>
  );
}
