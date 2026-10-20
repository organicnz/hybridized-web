import type { Metadata } from "next";
import { SignupPage } from "./signup-client";

export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Create a free Hybridized account to save your audio preferences and sync them everywhere.",
  robots: { index: false },
};

export default function Page() {
  return <SignupPage />;
}
