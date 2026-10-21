import { AudioEngineDemo } from "@/components/audio-engine-demo";
import { ScrollReveal } from "@/components/scroll-reveal";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Audio Engine Demo",
  description:
    "Demo of the Hybridized hardware-accelerated audio engine with dynamic compression, parametric EQ and 3D spatial audio.",
};

export default function AudioDemoPage() {
  return (
    // `id` so the root layout's "Skip to content" link has a target here —
    // this page does not use <AppShell>.
    <div id="main-content" className={cn("bg-gradient-hero min-h-screen p-8")}>
      <div className="mx-auto max-w-4xl space-y-8">
        <ScrollReveal variant="fade-up" delay={100} className="mb-12 text-center">
          <h1 className="mb-4 bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-fluid-xl font-bold text-transparent">
            Hardware-Accelerated Audio Engine
          </h1>
          <p className="text-muted-foreground">
            Professional-grade audio processing with 10-band EQ, 3D spatial audio, and dynamic
            compression
          </p>
        </ScrollReveal>

        <ScrollReveal variant="scale-up" delay={200} className="mx-auto max-w-2xl">
          <AudioEngineDemo />
          <p className="mt-2 text-center text-xs text-muted-foreground/60">
            Frequency visualisation renders on the GPU via WebGPU, with an automatic Canvas 2D
            fallback.
          </p>
        </ScrollReveal>

        <ScrollReveal variant="fade-up" delay={300} className="grid gap-6 md:grid-cols-2">
          <section className={cn("card-raised p-6")}>
            <h2 className="mb-4 text-xl font-semibold text-foreground">Features</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✓ 48kHz sample rate for studio quality</li>
              <li>✓ 10-band parametric equalizer</li>
              <li>✓ HRTF-based 3D spatial audio</li>
              <li>✓ Dynamic range compression</li>
              <li>✓ Hardware-accelerated processing</li>
              <li>✓ 10 EQ presets (Bass, Treble, Vocal, etc.)</li>
              <li>✓ 6 spatial presets (Concert Hall, Wide, etc.)</li>
            </ul>
          </section>

          <section className={cn("card-raised p-6")}>
            <h2 className="mb-4 text-xl font-semibold text-foreground">Technical Details</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Web Audio API with AudioContext</li>
              <li>• BiquadFilter nodes for EQ bands</li>
              <li>• PannerNode with HRTF panning model</li>
              <li>• DynamicsCompressor for volume leveling</li>
              <li>• Low-latency playback optimization</li>
              <li>• Real-time parameter adjustments</li>
              <li>• Cross-browser compatible</li>
            </ul>
          </section>
        </ScrollReveal>
      </div>
    </div>
  );
}
