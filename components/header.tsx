import Link from "next/link";

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold">
          Hybridized
        </Link>
        <nav className="hidden md:flex gap-6">
          <Link href="/home" className="hover:text-primary transition-colors">
            Home
          </Link>
          <Link href="/about" className="hover:text-primary transition-colors">
            About
          </Link>
          <Link href="/tests" className="hover:text-primary transition-colors">
            Tests
          </Link>
          <Link href="/contact" className="hover:text-primary transition-colors">
            Contact
          </Link>
          <Link href="/donation" className="hover:text-primary transition-colors">
            Donation
          </Link>
        </nav>
        <Link
          href="/auth/login"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
        >
          Login
        </Link>
      </div>
    </header>
  );
}
