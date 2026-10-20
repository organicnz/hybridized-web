import type { Metadata } from "next";
import { ResetPasswordPage } from "./reset-password-client";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Choose a new password for your Hybridized account.",
  robots: { index: false },
};

export default function Page() {
  return <ResetPasswordPage />;
}
