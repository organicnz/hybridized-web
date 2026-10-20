import type { Metadata } from "next";
import { ForgotPasswordPage } from "./forgot-password-client";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your Hybridized account password.",
  robots: { index: false },
};

export default function Page() {
  return <ForgotPasswordPage />;
}
