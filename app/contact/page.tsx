import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Mail, MessageSquare, Send } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-900 via-black to-blue-900">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <Mail className="w-16 h-16 text-purple-400 mx-auto mb-6" />
            <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
              Get in Touch
            </h1>
            <p className="text-xl text-purple-200/80">
              Have questions? We'd love to hear from you
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-8 md:p-12">
            <form className="space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-black/30 border border-purple-500/30 rounded-lg text-white placeholder:text-purple-300/50 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-white font-medium mb-2">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 bg-black/30 border border-purple-500/30 rounded-lg text-white placeholder:text-purple-300/50 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-white font-medium mb-2">Message</label>
                <textarea
                  className="w-full px-4 py-3 bg-black/30 border border-purple-500/30 rounded-lg text-white placeholder:text-purple-300/50 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                  rows={6}
                  placeholder="Tell us what's on your mind..."
                />
              </div>
              <button
                type="submit"
                className="w-full px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:scale-105 transition-transform shadow-lg shadow-purple-500/50 flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Send Message
              </button>
            </form>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6">
              <MessageSquare className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="text-white font-semibold mb-2">Chat with us</h3>
              <p className="text-blue-200/70 text-sm">
                We typically respond within 24 hours
              </p>
            </div>
            <div className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 backdrop-blur-sm rounded-xl border border-pink-500/20 p-6">
              <Mail className="w-8 h-8 text-pink-400 mb-4" />
              <h3 className="text-white font-semibold mb-2">Email us</h3>
              <p className="text-pink-200/70 text-sm">
                hello@hybridized.com
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
