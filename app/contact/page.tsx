import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Mail, MessageSquare, Send } from "lucide-react";
import { Suspense } from "react";
import { cn } from "@/lib/utils";

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
          <div className="text-center mb-8">
            <Mail className="w-10 h-10 text-primary mx-auto mb-3" />
            <h1 className="text-fluid-xl font-black bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent mb-2">
              Get in Touch
            </h1>
            <p className="text-muted-foreground">Have questions? We'd love to hear from you</p>
          </div>

          <div className="card-raised p-6 md:p-8">
            <form className="space-y-4">
              <div>
                <label htmlFor="name" className="label">
                  Name
                </label>
                <input id="name" type="text" className="input" placeholder="Your name" />
              </div>
              <div>
                <label htmlFor="email" className="label">
                  Email
                </label>
                <input id="email" type="email" className="input" placeholder="your@email.com" />
              </div>
              <div>
                <label htmlFor="message" className="label">
                  Message
                </label>
                <textarea
                  id="message"
                  className="input resize-none"
                  rows={4}
                  placeholder="Tell us what's on your mind..."
                />
              </div>
              <button type="submit" className="btn btn-primary btn-lg w-full justify-center gap-2">
                <Send className="w-4 h-4" />
                Send Message
              </button>
            </form>
          </div>

          <div className="mt-6 grid md:grid-cols-2 gap-4">
            <section className={cn("card-flat p-4 text-center")}>
              <MessageSquare className="w-6 h-6 text-primary mx-auto mb-2" />
              <h2 className="text-sm font-semibold text-foreground mb-1">Chat with us</h2>
              <p className="text-xs text-muted-foreground">Respond within 24h</p>
            </section>
            <section className={cn("card-flat p-4 text-center")}>
              <Mail className="w-6 h-6 text-primary mx-auto mb-2" />
              <h2 className="text-sm font-semibold text-foreground mb-1">Email us</h2>
              <p className="text-xs text-muted-foreground">hello@hybridized.com</p>
            </section>
          </div>
        </div>
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}
