import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Heart, Coffee, Sparkles, Zap } from "lucide-react";

export default function DonationPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-900 via-black to-blue-900">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <Heart className="w-16 h-16 text-pink-400 mx-auto mb-6 animate-pulse" />
            <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mb-6">
              Support Our Mission
            </h1>
            <p className="text-xl text-purple-200/80 max-w-2xl mx-auto">
              Help us continue creating innovative musical experiences and pushing the boundaries of sound
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 backdrop-blur-sm rounded-2xl border border-yellow-500/20 p-8 text-center hover:scale-105 transition-transform cursor-pointer">
              <Coffee className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">$5</h3>
              <p className="text-yellow-200/70">Buy us a coffee</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-8 text-center hover:scale-105 transition-transform cursor-pointer ring-2 ring-purple-500/50">
              <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">$25</h3>
              <p className="text-purple-200/70">Support our work</p>
              <div className="mt-2 text-xs text-purple-300 font-semibold">POPULAR</div>
            </div>
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm rounded-2xl border border-blue-500/20 p-8 text-center hover:scale-105 transition-transform cursor-pointer">
              <Zap className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">$100</h3>
              <p className="text-blue-200/70">Become a patron</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-8 md:p-12 mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Custom Amount</h2>
            <div className="flex gap-4 max-w-md mx-auto">
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 bg-black/30 border border-purple-500/30 rounded-lg text-white placeholder:text-purple-300/50 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
              </div>
              <button className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:scale-105 transition-transform shadow-lg shadow-purple-500/50">
                Donate
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 backdrop-blur-sm rounded-2xl border border-pink-500/20 p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Why Support Us?</h2>
            <ul className="space-y-3 text-pink-200/80">
              <li className="flex items-start gap-3">
                <Heart className="w-5 h-5 text-pink-400 flex-shrink-0 mt-1" />
                <span>Help us create more innovative musical content</span>
              </li>
              <li className="flex items-start gap-3">
                <Heart className="w-5 h-5 text-pink-400 flex-shrink-0 mt-1" />
                <span>Support the development of new features and tools</span>
              </li>
              <li className="flex items-start gap-3">
                <Heart className="w-5 h-5 text-pink-400 flex-shrink-0 mt-1" />
                <span>Keep our platform free and accessible to everyone</span>
              </li>
              <li className="flex items-start gap-3">
                <Heart className="w-5 h-5 text-pink-400 flex-shrink-0 mt-1" />
                <span>Enable us to collaborate with more artists and creators</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
