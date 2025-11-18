import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function DonationPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Donation</h1>
        <div className="max-w-2xl">
          <p className="text-lg text-muted-foreground mb-6">
            Support our work and help us continue to grow.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
