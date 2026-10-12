import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { ProfilePage } from "./profile-client";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your Hybridized profile, avatar and audio preferences.",
  robots: { index: false },
};

export default function Page() {
  return (
    <AppShell>
      <ProfilePage />
    </AppShell>
  );
}
