import { AppShell } from "@/components/app-shell";
import type { Metadata } from "next";
import { DonationClient } from "./donation-client";

export const metadata: Metadata = {
  title: "Donate",
  description: "Support the Hybridized archive.",
};

export default function DonationPage() {
  return (
    <AppShell>
      <DonationClient />
    </AppShell>
  );
}
