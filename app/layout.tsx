import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });

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
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Suspense } from "react";
import { Toaster } from "sonner";
import { RegisterServiceWorker } from "./register-sw";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${display.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
          >
            Skip to content
          </a>
          <div className="fixed inset-0 pointer-events-none app-mesh z-[-1]" aria-hidden="true" />
          <RegisterServiceWorker />
          <RecoveryHandler />
          <Toaster
            position="top-center"
            richColors
            closeButton
            toastOptions={{
              style: {
                background: "var(--popover)",
                border: "1px solid var(--border)",
                color: "var(--popover-foreground)",
              },
            }}
          />
          <AudioPlayerProvider>
            {children}
            <AudioPlayerBar />
          </AudioPlayerProvider>
          {/* SpeedInsights reads the route params to report the page path, so
              it has to sit behind a Suspense boundary in the shared root
              layout — otherwise the static shell of every dynamic route
              becomes URL-specific and cannot be prerendered. It renders
              nothing visible, so an empty fallback is correct. */}
          <Suspense fallback={null}>
            <SpeedInsights />
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
