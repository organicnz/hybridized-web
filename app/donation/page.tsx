import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Heart, Coffee, Sparkles, Zap } from "lucide-react";

export default function DonationPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#121212]">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <Heart className="w-16 h-16 text-green-400 mx-auto mb-6 animate-pulse" />
            <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-6">
              Support Our Mission
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Help us continue creating innovative musical experiences and
              pushing the boundaries of sound
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-8 text-center hover:scale-105 transition-transform cursor-pointer">
              <Coffee className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">$5</h3>
              <p className="text-white/70">Buy us a coffee</p>
            </div>
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-green-400/50 p-8 text-center hover:scale-105 transition-transform cursor-pointer ring-2 ring-green-400/50">
              <Sparkles className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">$25</h3>
              <p className="text-white/70">Support our work</p>
              <div className="mt-2 text-xs text-green-400 font-semibold">
                POPULAR
              </div>
            </div>
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-8 text-center hover:scale-105 transition-transform cursor-pointer">
              <Zap className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">$100</h3>
              <p className="text-white/70">Become a patron</p>
            </div>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-8 md:p-12 mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              Custom Amount
            </h2>
            <div className="flex gap-4 max-w-md mx-auto">
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 bg-[#181818] border border-white/10 rounded-lg text-white placeholder:text-white/50 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 transition-all"
                />
              </div>
              <button className="px-8 py-3 bg-green-400 text-black rounded-full font-semibold hover:scale-105 transition-transform shadow-lg shadow-green-400/50">
                Donate
              </button>
            </div>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              Why Support Us?
            </h2>
            <ul className="space-y-3 text-white/70">
              <li className="flex items-start gap-3">
                <Heart className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                <span>Help us create more innovative musical content</span>
              </li>
              <li className="flex items-start gap-3">
                <Heart className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                <span>Support the development of new features and tools</span>
              </li>
              <li className="flex items-start gap-3">
                <Heart className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                <span>Keep our platform free and accessible to everyone</span>
              </li>
              <li className="flex items-start gap-3">
                <Heart className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                <span>
                  Enable us to collaborate with more artists and creators
                </span>
              </li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
