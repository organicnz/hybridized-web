import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hybridized - Music Archive & Streaming Platform",
  description: "Discover and stream DJ mixes, radio shows, and electronic music from top artists",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "any" },
      { url: "/logo.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/logo.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

import { RegisterServiceWorker } from "./register-sw";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
