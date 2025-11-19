import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Music, Sparkles, Users, Heart } from "lucide-react";

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
                    Our Mission
                  </h2>
                  <p className="text-white/70 leading-relaxed">
                    Hybridized is dedicated to exploring the intersection of
                    music, technology, and creativity. We create unique hybrid
                    sounds by combining different musical elements, formulas,
                    and genres to produce something entirely new and innovative.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
              <div className="flex items-start gap-4 mb-4">
                <Sparkles className="w-8 h-8 text-green-400 flex-shrink-0" />
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    What We Do
                  </h2>
                  <p className="text-white/70 leading-relaxed mb-4">
                    We experiment with musical formulas, create interactive
                    tests, and provide a platform for music enthusiasts to
                    discover new sounds. Our approach combines traditional music
                    theory with cutting-edge technology to push the boundaries
                    of what's possible.
                  </p>
                  <ul className="space-y-2 text-white/70">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      Create unique hybrid musical formulas
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      Develop interactive musical tests and experiences
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      Build a community of music innovators
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
              <div className="flex items-start gap-4 mb-4">
                <Users className="w-8 h-8 text-green-400 flex-shrink-0" />
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    Join Our Community
                  </h2>
                  <p className="text-white/70 leading-relaxed">
                    Whether you're a musician, producer, or simply a music
                    lover, Hybridized welcomes you to explore, experiment, and
                    contribute to the future of music. Together, we're creating
                    something extraordinary.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center pt-8">
              <div className="inline-flex items-center gap-2 text-white/50">
                <span>Made with</span>
                <Heart className="w-5 h-5 text-green-400" />
                <span>for music lovers everywhere</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
