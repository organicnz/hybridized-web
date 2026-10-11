import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hybridized.online";
const SITE_NAME = "Hybridized";
const SITE_DESCRIPTION =
  "Discover and stream DJ mixes, radio shows, and electronic music from top artists";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - Music Archive & Streaming Platform`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "electronic music",
    "DJ mixes",
    "radio shows",
    "music streaming",
    "progressive house",
    "trance",
    "breakbeat",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} - Music Archive & Streaming Platform`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - Music Archive & Streaming Platform`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "any" },
      { url: "/logo.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/logo.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
};

import { AudioPlayerBar } from "@/components/audio-player-bar";
import { RecoveryHandler } from "@/components/auth/recovery-handler";
import { AudioPlayerProvider } from "@/lib/audio-player-context";
import { Toaster } from "sonner";
import { RegisterServiceWorker } from "./register-sw";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <RegisterServiceWorker />
        <RecoveryHandler />
        <Toaster position="top-center" richColors />
        <AudioPlayerProvider>
          {children}
          <AudioPlayerBar />
        </AudioPlayerProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
