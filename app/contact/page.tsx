import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Mail, MessageSquare, Send } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#121212]">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <Mail className="w-16 h-16 text-green-400 mx-auto mb-6" />
            <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-6">
              Get in Touch
            </h1>
            <p className="text-xl text-white/70">
              Have questions? We'd love to hear from you
            </p>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-8 md:p-12">
            <form className="space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">
                  Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-[#181818] border border-white/10 rounded-lg text-white placeholder:text-white/50 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 transition-all"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-white font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 bg-[#181818] border border-white/10 rounded-lg text-white placeholder:text-white/50 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 transition-all"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-white font-medium mb-2">
                  Message
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-[#181818] border border-white/10 rounded-lg text-white placeholder:text-white/50 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 transition-all resize-none"
                  rows={6}
                  placeholder="Tell us what's on your mind..."
                />
              </div>
              <button
                type="submit"
                className="w-full px-8 py-4 bg-green-400 text-black rounded-full font-semibold hover:scale-105 transition-transform shadow-lg shadow-green-400/50 flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Send Message
              </button>
            </form>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <MessageSquare className="w-8 h-8 text-green-400 mb-4" />
              <h3 className="text-white font-semibold mb-2">Chat with us</h3>
              <p className="text-white/70 text-sm">
                We typically respond within 24 hours
              </p>
            </div>
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <Mail className="w-8 h-8 text-green-400 mb-4" />
              <h3 className="text-white font-semibold mb-2">Email us</h3>
              <p className="text-white/70 text-sm">hello@hybridized.com</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
