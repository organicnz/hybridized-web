import { AudioEngineDemo } from "@/components/audio-engine-demo";
import type { Metadata } from "next";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Audio Engine Demo",
  description:
    "Demo of the Hybridized hardware-accelerated audio engine with dynamic compression, parametric EQ and 3D spatial audio.",
};

export default function AudioDemoPage() {
  return (
    <div className={cn("min-h-screen p-8 bg-gradient-hero")}>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center mb-12">
          <h1 className="text-fluid-xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent mb-4">
            Hardware-Accelerated Audio Engine
          </h1>
          <p className="text-muted-foreground">
            Professional-grade audio processing with 10-band EQ, 3D spatial audio, and dynamic
            compression
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <AudioEngineDemo />
          <p className="text-muted-foreground/60 text-xs text-center mt-2">
            Frequency visualisation renders on the GPU via WebGPU, with an automatic Canvas 2D
            fallback.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <section className={cn("card-raised p-6")}>
            <h2 className="text-xl font-semibold text-foreground mb-4">Features</h2>
            <ul className="space-y-2 text-muted-foreground text-sm">
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
            <h2 className="text-xl font-semibold text-foreground mb-4">Technical Details</h2>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>• Web Audio API with AudioContext</li>
              <li>• BiquadFilter nodes for EQ bands</li>
              <li>• PannerNode with HRTF panning model</li>
              <li>• DynamicsCompressor for volume leveling</li>
              <li>• Low-latency playback optimization</li>
              <li>• Real-time parameter adjustments</li>
              <li>• Cross-browser compatible</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
