"use client";

import { Mail, MessageSquare, Send } from "lucide-react";
import { useState } from "react";
import { ScrollReveal } from "@/components/scroll-reveal";
import { cn } from "@/lib/utils";

const CONTACT_EMAIL = "hello@hybridized.com";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError(null);

    // Dependency-free delivery: hand off to the visitor's mail client
    const subject = `Hybridized contact — ${name.trim()}`;
    const body = `${message.trim()}\n\n—\n${name.trim()}\n${email.trim()}`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    setSent(true);
  };

  return (
    <>
      <ScrollReveal variant="fade-up" delay={100} className="text-center mb-8">
        <Mail className="w-10 h-10 text-primary mx-auto mb-3" />
        <h1 className="text-fluid-xl font-black bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent mb-2">
          Get in Touch
        </h1>
        <p className="text-muted-foreground">Have questions? We&apos;d love to hear from you</p>
      </ScrollReveal>

      <ScrollReveal variant="scale-up" delay={200} className="max-w-2xl mx-auto">
        <div className="card-raised p-6 md:p-8">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="label">
                Name
              </label>
              <input
                id="name"
                type="text"
                className="input"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
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
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            {sent && !error && (
              <output className="text-sm text-primary">
                Opening your mail app — we&apos;ll reply within 24h.
              </output>
            )}

            <button type="submit" className="btn btn-primary btn-lg w-full justify-center gap-2">
              <Send className="w-4 h-4" />
              Send Message
            </button>
          </form>
        </div>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={300} className="mt-6 grid md:grid-cols-2 gap-4">
        <section className={cn("card-flat p-4 text-center")}>
          <MessageSquare className="w-6 h-6 text-primary mx-auto mb-2" />
          <h2 className="text-sm font-semibold text-foreground mb-1">Chat with us</h2>
          <p className="text-xs text-muted-foreground">Respond within 24h</p>
        </section>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className={cn("card-flat p-4 text-center transition-colors hover:border-primary/30")}
        >
          <Mail className="w-6 h-6 text-primary mx-auto mb-2" />
          <h2 className="text-sm font-semibold text-foreground mb-1">Email us</h2>
          <p className="text-xs text-muted-foreground">{CONTACT_EMAIL}</p>
        </a>
      </ScrollReveal>
    </>
  );
}
