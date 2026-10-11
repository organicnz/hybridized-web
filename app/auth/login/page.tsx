import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginPage } from "./login-client";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to Hybridized to sync your equalizer settings and playlists across devices.",
  robots: { index: false },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}
