"use client";

import { ScrollReveal } from "@/components/scroll-reveal";
import { Mail, MessageSquare, Send } from "lucide-react";
import { useState } from "react";

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
      <ScrollReveal variant="fade-up" delay={100} className="mb-8 text-center">
        <span className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-border">
          <Mail className="h-8 w-8 text-primary" aria-hidden="true" />
        </span>
        <h1 className="gradient-text mb-2 font-display text-fluid-xl font-bold tracking-tight">
          Get in Touch
        </h1>
        <p className="text-muted-foreground">Have questions? We&apos;d love to hear from you</p>
      </ScrollReveal>

      <ScrollReveal variant="scale-up" delay={200} className="mx-auto max-w-2xl">
        <div className="glass p-6 md:p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="label mb-1.5 block">
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
              <label htmlFor="email" className="label mb-1.5 block">
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
              <label htmlFor="message" className="label mb-1.5 block">
                Message
              </label>
              <textarea
                id="message"
                className="input min-h-28 resize-y"
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
              <Send className="h-4 w-4" />
              Send Message
            </button>
          </form>
        </div>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={300} className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="glass p-5 text-center">
          <MessageSquare className="mx-auto mb-2 h-6 w-6 text-primary" />
          <h2 className="mb-1 text-sm font-semibold text-foreground">Chat with us</h2>
          <p className="text-xs text-muted-foreground">Respond within 24h</p>
        </section>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="glass p-5 text-center transition-all hover:-translate-y-0.5 hover:shadow-glow"
        >
          <Mail className="mx-auto mb-2 h-6 w-6 text-primary" />
          <h2 className="mb-1 text-sm font-semibold text-foreground">Email us</h2>
          <p className="text-xs text-muted-foreground">{CONTACT_EMAIL}</p>
        </a>
      </ScrollReveal>
    </>
  );
}
