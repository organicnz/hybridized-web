import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Mail, MessageSquare, Send } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="h-screen flex flex-col bg-[#121212] overflow-hidden">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-4 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-4">
            <Mail className="w-10 h-10 text-green-400 mx-auto mb-2" />
            <h1 className="text-3xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">
              Get in Touch
            </h1>
            <p className="text-sm text-white/70">
              Have questions? We'd love to hear from you
            </p>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-white/10 p-4">
            <form className="space-y-3">
              <div>
                <label className="block text-white text-sm font-medium mb-1">
                  Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-[#181818] border border-white/10 rounded-lg text-white text-sm placeholder:text-white/50 focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400/50 transition-all"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 bg-[#181818] border border-white/10 rounded-lg text-white text-sm placeholder:text-white/50 focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400/50 transition-all"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-1">
                  Message
                </label>
                <textarea
                  className="w-full px-3 py-2 bg-[#181818] border border-white/10 rounded-lg text-white text-sm placeholder:text-white/50 focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400/50 transition-all resize-none"
                  rows={3}
                  placeholder="Tell us what's on your mind..."
                />
              </div>
              <button
                type="submit"
                className="w-full px-6 py-2.5 bg-green-400 text-black rounded-full font-semibold hover:scale-105 transition-transform shadow-lg shadow-green-400/50 flex items-center justify-center gap-2 text-sm"
              >
                <Send className="w-4 h-4" />
                Send Message
              </button>
            </form>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-white/10 p-3">
              <MessageSquare className="w-6 h-6 text-green-400 mb-2" />
              <h3 className="text-white text-sm font-semibold mb-1">
                Chat with us
              </h3>
              <p className="text-white/70 text-xs">Respond within 24h</p>
            </div>
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-white/10 p-3">
              <Mail className="w-6 h-6 text-green-400 mb-2" />
              <h3 className="text-white text-sm font-semibold mb-1">
                Email us
              </h3>
              <p className="text-white/70 text-xs">hello@hybridized.com</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
