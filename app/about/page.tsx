import { AppShell } from "@/components/app-shell";
import { Download, Heart, Music, Sparkles, Users } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Hybridized — the music archive and streaming platform for electronic music, DJ mixes and radio shows.",
};

export const cacheLife = "days";

const FEATURED_ARTISTS = [
  "Alex Hall",
  "Andrew Kelly",
  "Benz & MD",
  "Burufunk",
  "Deepsky",
  "Digital Witchcraft",
  "Grayarea",
  "Hybrid",
  "James Warren",
  "Jason Dunne",
  "J-Slyde",
  "KiloWatts",
  "Micah",
  "Nick Lewis",
  "Noel Sanger",
  "NuBreed",
  "Shiloh",
  "Stefan Weise",
  "Trafik",
  "V-Sag",
  "Way Out West",
];

export default function AboutPage() {
  return (
    <AppShell>
      <div className="section-container py-10 md:py-14">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center md:mb-16">
            <h1 className="gradient-text mb-4 font-display text-5xl font-bold tracking-tight md:text-6xl">
              About Hybridized
            </h1>
            <p className="text-xl text-muted-foreground">
              Pioneering the future of musical innovation
            </p>
          </div>

          <div className="space-y-6">
            <div className="glass rounded-2xl p-8">
              <div className="mb-4 flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-border">
                  <Music className="h-6 w-6 text-primary" />
                </span>
                <div>
                  <h2 className="mb-4 font-display text-2xl font-bold text-foreground">
                    About Hybridized
                  </h2>
                  <p className="mb-4 leading-relaxed text-muted-foreground">
                    Hybridized features live and DJ mixes from a select group of electronic artists.
                    With nearly all mixes provided by the artists themselves, this is your best
                    source for the highest quality breaks and progressive music.
                  </p>
                  <p className="leading-relaxed text-muted-foreground">
                    New mixes are posted several times a week, bringing you the freshest sounds from
                    the electronic music scene.
                  </p>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-8">
              <div className="mb-4 flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-border">
                  <Download className="h-6 w-6 text-primary" />
                </span>
                <div>
                  <h2 className="mb-4 font-display text-2xl font-bold text-foreground">
                    Download All Sets
                  </h2>
                  <p className="mb-6 leading-relaxed text-muted-foreground">
                    Access the complete collection of Hybridized sets. Download all mixes from our
                    cloud storage and enjoy the full archive of electronic music excellence.
                  </p>
                  <a
                    href="https://cloud.mail.ru/public/Beaq/6WtmkWwTe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-lg"
                  >
                    <Download className="h-5 w-5" />
                    Download Complete Archive
                  </a>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-8">
              <div className="mb-4 flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-border">
                  <Sparkles className="h-6 w-6 text-primary" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="mb-4 font-display text-2xl font-bold text-foreground">
                    Featured Artists
                  </h2>
                  <p className="mb-4 leading-relaxed text-muted-foreground">
                    Featuring mixes from some of the most talented artists in electronic music:
                  </p>
                  <ul className="grid grid-cols-2 gap-3 text-muted-foreground md:grid-cols-3">
                    {FEATURED_ARTISTS.map((name) => (
                      <li key={name} className="flex items-center gap-2 text-sm">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full bg-linear-to-r from-purple-500 to-pink-500"
                          aria-hidden="true"
                        />
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-8">
              <div className="mb-4 flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-border">
                  <Users className="h-6 w-6 text-primary" />
                </span>
                <div>
                  <h2 className="mb-4 font-display text-2xl font-bold text-foreground">
                    Our Legacy
                  </h2>
                  <p className="leading-relaxed text-muted-foreground">
                    Continuing the amazing work of Andy Grundman, Hybridized remains committed to
                    bringing you the finest electronic music from around the world.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-8 text-center">
              <div className="inline-flex items-center gap-2 text-muted-foreground">
                <span>Made with</span>
                <Heart className="h-5 w-5 fill-pink-500 text-pink-500" />
                <span>for electronic music lovers everywhere</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
