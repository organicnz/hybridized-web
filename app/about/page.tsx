import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Music, Sparkles, Users, Heart, Download } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#121212]">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-6">
              About Hybridized
            </h1>
            <p className="text-xl text-white/70">
              Pioneering the future of musical innovation
            </p>
          </div>

          <div className="space-y-12">
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
              <div className="flex items-start gap-4 mb-4">
                <Music className="w-8 h-8 text-green-400 flex-shrink-0" />
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    About Hybridized
                  </h2>
                  <p className="text-white/70 leading-relaxed mb-4">
                    Hybridized features live and DJ mixes from a select group of
                    electronic artists. With nearly all mixes provided by the
                    artists themselves, this is your best source for the highest
                    quality breaks and progressive music.
                  </p>
                  <p className="text-white/70 leading-relaxed">
                    New mixes are posted several times a week, bringing you the
                    freshest sounds from the electronic music scene.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
              <div className="flex items-start gap-4 mb-4">
                <Download className="w-8 h-8 text-green-400 flex-shrink-0" />
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    Download All Sets
                  </h2>
                  <p className="text-white/70 leading-relaxed mb-6">
                    Access the complete collection of Hybridized sets. Download
                    all mixes from our cloud storage and enjoy the full archive
                    of electronic music excellence.
                  </p>
                  <a
                    href="https://cloud.mail.ru/public/Beaq/6WtmkWwTe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-400 to-emerald-400 text-black font-semibold rounded-lg hover:scale-105 transition-transform gpu"
                  >
                    <Download className="w-5 h-5" />
                    Download Complete Archive
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
              <div className="flex items-start gap-4 mb-4">
                <Sparkles className="w-8 h-8 text-green-400 flex-shrink-0" />
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    Featured Artists
                  </h2>
                  <p className="text-white/70 leading-relaxed mb-4">
                    Featuring mixes from some of the most talented artists in
                    electronic music:
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-white/70">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      Alex Hall
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      Andrew Kelly
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      Benz & MD
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      Burufunk
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      Deepsky
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      Digital Witchcraft
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      Grayarea
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      Hybrid
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      James Warren
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      Jason Dunne
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      J-Slyde
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      KiloWatts
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      Micah
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      Nick Lewis
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      Noel Sanger
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      NuBreed
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      Shiloh
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      Stefan Weise
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      Trafik
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      V-Sag
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      Way Out West
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
              <div className="flex items-start gap-4 mb-4">
                <Users className="w-8 h-8 text-green-400 flex-shrink-0" />
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    Our Legacy
                  </h2>
                  <p className="text-white/70 leading-relaxed">
                    Continuing the amazing work of Andy Grundman, Hybridized
                    remains committed to bringing you the finest electronic
                    music from around the world.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center pt-8">
              <div className="inline-flex items-center gap-2 text-white/50">
                <span>Made with</span>
                <Heart className="w-5 h-5 text-green-400" />
                <span>for electronic music lovers everywhere</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
