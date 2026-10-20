import audioBarsShader from "@/shaders/audio-bars.wgsl";
import { clock, effect, frameLoop, init, surface, uniforms } from "vgpu";
import type { Frame, FrameLoopHandle, Gpu } from "vgpu";

export { BAR_COUNT, computeBars } from "@/lib/vgpu/spectrum";

export interface VisualizerHandle {
  /** Push normalised bar heights (0..1, length BAR_COUNT) to the GPU. */
  setBars: (bars: Float32Array) => void;
  /** Stop the render loop without disposing the device. */
  pause: () => void;
  /** Resume the render loop after a pause. */
  resume: () => void;
  /** Stop the loop and release the GPU device. Safe to call more than once. */
  dispose: () => void;
}

interface GpuVisualizerOptions {
  dpr?: [number, number];
  label?: string;
  /** Called when the device is lost or a frame fails validation. */
  onError?: (error: unknown) => void;
}

export interface StartGpuVisualizerResult {
  handle: VisualizerHandle;
  gpu: Gpu;
}

/**
 * Start a WebGPU frequency-bar visualiser on `canvas`.
 *
 * Throws when WebGPU is unavailable so callers can fall back to Canvas 2D.
 */
export async function startGpuVisualizer(
  canvas: HTMLCanvasElement,
  options: GpuVisualizerOptions = {},
): Promise<StartGpuVisualizerResult> {
  let disposed = false;
  const gpu = await init();

  // Device loss and async validation failures are reported here rather than
  // thrown. Subscribing lets the caller fall back instead of leaving unhandled
  // rejections, and guarantees the listener is torn down with the device.
  const unsubscribe = gpu.onError((error) => {
    if (disposed) return;
    options.onError?.(error);
  });

  const canvasSurface = surface(gpu, canvas, { dpr: options.dpr ?? [1, 2] });
  const params = uniforms(gpu, { time: 0, texel: canvasSurface.texelSize, barCount: 64 });
  const spectrum = uniforms(gpu, { values: new Float32Array(64) });

  const visualizer = effect(gpu, audioBarsShader, {
    label: options.label ?? "audio-bars",
    set: { params, spectrum },
  });

  canvasSurface.onResize(() => {
    params.set({ texel: canvasSurface.texelSize });
  });

  const time = clock(gpu);
  let running = false;
  let loop: FrameLoopHandle;

  const renderFrame = (frame: Frame) => {
    if (disposed) return;
    try {
      params.set({ time: time.time });
      frame.pass(canvasSurface, visualizer);
    } catch (error) {
      // A lost device can surface mid-pass. Stop the loop instead of letting
      // the exception escape the animation frame.
      disposed = true;
      if (running) {
        loop.stop();
        running = false;
      }
      options.onError?.(error);
    }
  };

  const startLoop = () => {
    loop = frameLoop(gpu, renderFrame);
    running = true;
  };

  startLoop();

  const handle: VisualizerHandle = {
    setBars(next: Float32Array) {
      if (disposed) return;
      // Writing to a lost device throws. Swallow it, report once, and let the
      // caller fall back rather than tearing down the animation frame.
      try {
        spectrum.set({ values: Float32Array.from(next) });
      } catch (error) {
        disposed = true;
        if (running) {
          loop.stop();
          running = false;
        }
        options.onError?.(error);
      }
    },
    pause() {
      if (!running) return;
      loop.stop();
      running = false;
    },
    resume() {
      // frameLoop exposes only stop(), so resuming starts a fresh loop.
      if (disposed || running) return;
      startLoop();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      if (running) {
        loop.stop();
        running = false;
      }
      unsubscribe();
      canvasSurface.dispose();
      gpu.dispose();
    },
  };

  return { handle, gpu };
}
