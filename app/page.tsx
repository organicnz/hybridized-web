import Link from "next/link";
import { Music, Sparkles, Headphones } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
        <div className="container mx-auto px-4 py-20 relative">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Music className="w-20 h-20 text-purple-400 animate-pulse" />
                <Sparkles className="w-8 h-8 text-yellow-400 absolute -top-2 -right-2 animate-bounce" />
              </div>
            </div>
            <h1 className="text-7xl md:text-8xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Hybridized
            </h1>
            <p className="text-2xl md:text-3xl text-purple-200 font-light">
              Where Music Meets Innovation
            </p>
            <p className="text-lg text-purple-300/80 max-w-2xl mx-auto">
              Discover unique hybrid sounds, explore musical formulas, and experience the future of music creation
            </p>
            <div className="flex gap-4 justify-center pt-6">
              <Link
                href="/home"
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full font-semibold text-white hover:scale-105 transition-transform shadow-lg shadow-purple-500/50"
              >
                Explore Music
              </Link>
              <Link
                href="/about"
                className="px-8 py-4 bg-white/10 backdrop-blur-sm rounded-full font-semibold text-white hover:bg-white/20 transition-colors border border-white/20"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Link
            href="/home"
            className="group relative p-8 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl border border-purple-500/20 hover:border-purple-500/50 transition-all hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:to-pink-500/10 rounded-2xl transition-all"></div>
            <div className="relative">
              <Headphones className="w-12 h-12 text-purple-400 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Hybrid Sounds</h3>
              <p className="text-purple-200/80">Explore our collection of unique musical hybrids and formulas</p>
            </div>
          </Link>

          <Link
            href="/tests"
            className="group relative p-8 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm rounded-2xl border border-blue-500/20 hover:border-blue-500/50 transition-all hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/10 group-hover:to-cyan-500/10 rounded-2xl transition-all"></div>
            <div className="relative">
              <Music className="w-12 h-12 text-blue-400 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Interactive Tests</h3>
              <p className="text-blue-200/80">Test your musical knowledge and discover new sounds</p>
            </div>
          </Link>

          <Link
            href="/contact"
            className="group relative p-8 bg-gradient-to-br from-pink-500/10 to-purple-500/10 backdrop-blur-sm rounded-2xl border border-pink-500/20 hover:border-pink-500/50 transition-all hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 to-purple-500/0 group-hover:from-pink-500/10 group-hover:to-purple-500/10 rounded-2xl transition-all"></div>
            <div className="relative">
              <Sparkles className="w-12 h-12 text-pink-400 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Get in Touch</h3>
              <p className="text-pink-200/80">Connect with us and join the musical revolution</p>
            </div>
          </Link>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="relative p-12 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-3xl border border-purple-500/30 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Support Our Mission</h2>
          <p className="text-xl text-purple-200 mb-8 max-w-2xl mx-auto">
            Help us continue creating innovative musical experiences
          </p>
          <Link
            href="/donation"
            className="inline-block px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full font-semibold text-black hover:scale-105 transition-transform shadow-lg shadow-yellow-500/50"
          >
            Support Us
          </Link>
        </div>
      </div>
    </main>
  );
}
