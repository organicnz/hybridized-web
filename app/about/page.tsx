import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">About</h1>
        <div className="prose max-w-none">
          <p className="text-lg text-muted-foreground">
            Learn more about Hybridized and our mission.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
