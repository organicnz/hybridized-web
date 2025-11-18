import Link from "next/link";
import { Music } from "lucide-react";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-purple-500/20">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-white hover:text-purple-400 transition-colors">
          <Music className="w-6 h-6" />
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Hybridized
          </span>
        </Link>
        <nav className="hidden md:flex gap-8">
          <Link href="/home" className="text-purple-200 hover:text-white transition-colors font-medium">
            Home
          </Link>
          <Link href="/about" className="text-purple-200 hover:text-white transition-colors font-medium">
            About
          </Link>
          <Link href="/tests" className="text-purple-200 hover:text-white transition-colors font-medium">
            Tests
          </Link>
          <Link href="/contact" className="text-purple-200 hover:text-white transition-colors font-medium">
            Contact
          </Link>
          <Link href="/donation" className="text-purple-200 hover:text-white transition-colors font-medium">
            Donation
          </Link>
        </nav>
        <Link
          href="/auth/login"
          className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:scale-105 transition-transform font-medium shadow-lg shadow-purple-500/30"
        >
          Login
        </Link>
      </div>
    </header>
  );
}
