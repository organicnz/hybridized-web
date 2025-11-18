import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("hybridized")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Home</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items?.map((item) => (
            <div key={item.id} className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
              {item.cover_url && (
                <img
                  src={item.cover_url}
                  alt={item.name || ""}
                  className="w-full h-48 object-cover rounded-md mb-4"
                />
              )}
              <h2 className="text-xl font-semibold mb-2">{item.name}</h2>
              <p className="text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
