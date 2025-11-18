import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Music2, Headphones, Radio, Mic } from "lucide-react";

export default function TestsPage() {
  const tests = [
    {
      icon: Music2,
      title: "Pitch Perfect",
      description: "Test your ability to identify musical notes and intervals",
      difficulty: "Beginner",
      color: "from-purple-500/10 to-pink-500/10",
      borderColor: "border-purple-500/20",
      iconColor: "text-purple-400"
    },
    {
      icon: Headphones,
      title: "Rhythm Master",
      description: "Challenge your sense of timing and rhythm patterns",
      difficulty: "Intermediate",
      color: "from-blue-500/10 to-cyan-500/10",
      borderColor: "border-blue-500/20",
      iconColor: "text-blue-400"
    },
    {
      icon: Radio,
      title: "Genre Detective",
      description: "Identify music genres from short audio clips",
      difficulty: "Advanced",
      color: "from-pink-500/10 to-purple-500/10",
      borderColor: "border-pink-500/20",
      iconColor: "text-pink-400"
    },
    {
      icon: Mic,
      title: "Harmony Hunter",
      description: "Recognize chord progressions and harmonic structures",
      difficulty: "Expert",
      color: "from-yellow-500/10 to-orange-500/10",
      borderColor: "border-yellow-500/20",
      iconColor: "text-yellow-400"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-900 via-black to-blue-900">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
              Musical Tests
            </h1>
            <p className="text-xl text-purple-200/80">
              Challenge yourself and discover your musical abilities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {tests.map((test, index) => {
              const Icon = test.icon;
              return (
                <div
                  key={index}
                  className={`group relative bg-gradient-to-br ${test.color} backdrop-blur-sm rounded-2xl border ${test.borderColor} hover:border-opacity-50 transition-all p-8 hover:scale-105 cursor-pointer`}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`p-3 bg-black/30 rounded-xl ${test.iconColor}`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-2xl font-bold text-white">{test.title}</h3>
                        <span className={`text-xs px-3 py-1 rounded-full ${test.iconColor} bg-black/30`}>
                          {test.difficulty}
                        </span>
                      </div>
                      <p className="text-purple-200/70">{test.description}</p>
                    </div>
                  </div>
                  <button className="w-full mt-4 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-colors border border-white/20">
                    Start Test
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-16 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-8 md:p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Coming Soon</h2>
            <p className="text-purple-200/80 max-w-2xl mx-auto">
              More interactive tests and challenges are on the way. Sign up to be notified when new tests become available!
            </p>
            <button className="mt-6 px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold hover:scale-105 transition-transform shadow-lg shadow-purple-500/50">
              Notify Me
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
