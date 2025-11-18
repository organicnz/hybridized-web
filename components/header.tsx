import Link from "next/link";
import { Search, User } from "lucide-react";

export function Header() {
  return (
    <header className="bg-[#4A5568] border-b border-black/10">
      <div className="px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center">
            <span className="text-white font-bold text-lg">H</span>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
            Hybridized
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/home" className="text-white hover:text-white/80 transition-colors font-medium">
            Main
          </Link>
          <Link href="/about" className="text-white hover:text-white/80 transition-colors font-medium">
            About
          </Link>
          <Link href="/contact" className="text-white hover:text-white/80 transition-colors font-medium">
            Contact
          </Link>
          <Link href="/donation" className="text-orange-400 hover:text-orange-300 transition-colors font-medium">
            Donation
          </Link>
        </nav>

        {/* Search & User */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="w-64 px-4 py-2 bg-[#5B6B7F] text-white placeholder:text-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400/50"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
          </div>
          <Link
            href="/auth/login"
            className="w-10 h-10 rounded-full bg-[#5B6B7F] flex items-center justify-center hover:bg-[#6B7B8F] transition-colors"
          >
            <User className="w-5 h-5 text-white" />
          </Link>
        </div>
      </div>
    </header>
  );
}
