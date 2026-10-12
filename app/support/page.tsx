import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { ArrowLeft, Book, Mail, MessageCircle } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Support",
  description: "Help center and FAQs for Hybridized — streaming, audio quality, accounts and more.",
};

export const cacheLife = "days";

export default function SupportPage() {
  return (
    <AppShell>
      <div className="section-container py-10 md:py-12">
        <Link
          href="/home"
          className="mb-8 inline-flex items-center gap-2 rounded-lg bg-card/70 px-3 py-2 text-sm text-muted-foreground ring-1 ring-border backdrop-blur-md transition-colors hover:text-foreground group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to Home
        </Link>
        <div className="max-w-4xl mx-auto">
          <h1 className="mb-4 font-display text-5xl font-bold tracking-tight gradient-text">Support</h1>
          <p className="text-muted-foreground text-lg mb-12">Need help? Choose the best way to get support.</p>
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/contact" className="glass rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-glow group">
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-border transition-transform group-hover:scale-105">
                <Mail className="w-7 h-7 text-primary" />
              </span>
              <h3 className="font-display text-xl font-semibold mb-2">Contact Us</h3>
              <p className="text-sm text-muted-foreground">Send us a message.</p>
            </Link>
            <Link href="/terms" className="glass rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-glow group">
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-border transition-transform group-hover:scale-105">
                <Book className="w-7 h-7 text-primary" />
              </span>
              <h3 className="font-display text-xl font-semibold mb-2">Terms</h3>
              <p className="text-sm text-muted-foreground">Read our terms of service.</p>
            </Link>
            <Link href="/privacy" className="glass rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-glow group">
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-border transition-transform group-hover:scale-105">
                <MessageCircle className="w-7 h-7 text-primary" />
              </span>
              <h3 className="font-display text-xl font-semibold mb-2">Privacy</h3>
              <p className="text-sm text-muted-foreground">Our privacy policy.</p>
            </Link>
          </div>
          <div className="mt-10 text-sm text-muted-foreground">
            <p>Also visit our <Link href="/donation" className="font-medium text-primary hover:underline">donation page</Link> to learn about supporting Hybridized.</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
