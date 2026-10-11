import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ContactForm } from "./contact-form";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Hybridized team — feedback, artist submissions and support.",
};

export const cacheLife = "days";

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <ContactForm />
        </div>
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}
