import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function TestsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Tests</h1>
        <div className="space-y-4">
          <p className="text-lg text-muted-foreground">
            View and manage test results.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
