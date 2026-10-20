import { AppShell } from "@/components/app-shell";
import type { Metadata } from "next";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Hybridized team — feedback, artist submissions and support.",
};

export const cacheLife = "days";

export default function ContactPage() {
  return (
    <AppShell>
      <div className="container mx-auto px-4 py-10 md:py-12">
        <div className="max-w-3xl mx-auto">
          <ContactForm />
        </div>
      </div>
    </AppShell>
  );
}
