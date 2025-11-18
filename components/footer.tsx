import { Music, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-black/50 backdrop-blur-md border-t border-purple-500/20 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Music className="w-6 h-6 text-purple-400" />
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Hybridized
              </span>
            </div>
            <p className="text-purple-200/60 text-sm">
              Where music meets innovation. Discover unique hybrid sounds and musical formulas.
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/home" className="text-purple-200/60 hover:text-purple-400 transition-colors">Home</a></li>
              <li><a href="/about" className="text-purple-200/60 hover:text-purple-400 transition-colors">About</a></li>
              <li><a href="/tests" className="text-purple-200/60 hover:text-purple-400 transition-colors">Tests</a></li>
              <li><a href="/contact" className="text-purple-200/60 hover:text-purple-400 transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <p className="text-purple-200/60 text-sm mb-4">
              Help us continue creating innovative musical experiences
            </p>
            <a href="/donation" className="inline-flex items-center gap-2 text-sm text-pink-400 hover:text-pink-300 transition-colors">
              <Heart className="w-4 h-4" />
              Make a Donation
            </a>
          </div>
        </div>
        <div className="border-t border-purple-500/20 pt-8 text-center">
          <p className="text-sm text-purple-200/40">
            &copy; {new Date().getFullYear()} Hybridized. All rights reserved. Made with <Heart className="w-4 h-4 inline text-pink-400" /> for music lovers.
          </p>
        </div>
      </div>
    </footer>
  );
}
