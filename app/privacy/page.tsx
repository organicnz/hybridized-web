import { AppShell } from "@/components/app-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Privacy policy for Hybridized.",
};

export default function PrivacyPage() {
  return (
    <AppShell>
      <div className="container mx-auto max-w-3xl px-4 py-10 md:py-12">
        <h1 className="mb-6 text-4xl font-black">Privacy</h1>
        <p className="text-muted-foreground">Privacy policy content.</p>
      </div>
    </AppShell>
  );
}
