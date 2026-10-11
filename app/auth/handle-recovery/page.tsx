import type { Metadata } from "next";
import { HandleRecoveryPage } from "./handle-recovery-client";

export const metadata: Metadata = {
  title: "Account Recovery",
  description: "Recover access to your Hybridized account.",
  robots: { index: false },
};

export default function Page() {
  return <HandleRecoveryPage />;
}
