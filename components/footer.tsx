export function Footer() {
  return (
    <footer className="bg-[#4A5568] border-t border-black/10 mt-auto">
      <div className="px-8 py-4 flex items-center justify-between text-sm text-white/70">
        {/* Left Side */}
        <div className="flex items-center gap-4">
          <span>© 2025 Hybridized</span>
          <span>·</span>
          <a href="/privacy" className="hover:text-white transition-colors">
            Privacy
          </a>
          <span>·</span>
          <a href="/terms" className="hover:text-white transition-colors">
            Terms
          </a>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🇬🇧</span>
            <span>English</span>
          </div>
          <span>·</span>
          <a href="/support" className="hover:text-white transition-colors">
            Support & Resources
          </a>
        </div>
      </div>
    </footer>
  );
}
