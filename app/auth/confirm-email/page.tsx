import type { Metadata } from "next";
import { ConfirmEmailPage } from "./confirm-email-client";

export const metadata: Metadata = {
  title: "Confirm Email",
  description: "Confirm your email address to activate your Hybridized account.",
  robots: { index: false },
};

export default function Page() {
  return <ConfirmEmailPage />;
}
