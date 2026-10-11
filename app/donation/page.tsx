import type { Metadata } from "next";
import { DonationPage } from "./donation-client";

export const metadata: Metadata = {
  title: "Support Hybridized",
  description:
    "Hybridized is free and listener-supported. Donate to help keep the music archive online and ad-free.",
};

export const cacheLife = "days";

export default function Page() {
  return <DonationPage />;
}
