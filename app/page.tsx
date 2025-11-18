import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Hybridized
          </h1>
          <p className="text-xl text-muted-foreground">
            Next.js 16 + Supabase + Tailwind + shadcn/ui
          </p>
        </div>

        <nav className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link
            href="/home"
            className="p-6 border rounded-lg hover:border-primary transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">Home</h2>
            <p className="text-sm text-muted-foreground">Main content page</p>
          </Link>
          <Link
            href="/about"
            className="p-6 border rounded-lg hover:border-primary transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">About</h2>
            <p className="text-sm text-muted-foreground">Learn more about us</p>
          </Link>
          <Link
            href="/tests"
            className="p-6 border rounded-lg hover:border-primary transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">Tests</h2>
            <p className="text-sm text-muted-foreground">View test results</p>
          </Link>
          <Link
            href="/contact"
            className="p-6 border rounded-lg hover:border-primary transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">Contact</h2>
            <p className="text-sm text-muted-foreground">Get in touch</p>
          </Link>
          <Link
            href="/donation"
            className="p-6 border rounded-lg hover:border-primary transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">Donation</h2>
            <p className="text-sm text-muted-foreground">Support our work</p>
          </Link>
          <Link
            href="/auth/login"
            className="p-6 border rounded-lg hover:border-primary transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">Login</h2>
            <p className="text-sm text-muted-foreground">Sign in to your account</p>
          </Link>
        </nav>
      </div>
    </main>
  );
}
