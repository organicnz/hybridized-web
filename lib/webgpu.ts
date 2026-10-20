/**
 * WebGPU feature detection and capability checks.
 * Pure utilities — no side effects, safe to import anywhere.
 *
 * `navigator.gpu` is not part of the DOM lib yet, and Bun's type checker
 * ships its own `NavigatorGPU` interface, where `gpu` is a required `GPU`.
 * The feature is therefore read through a narrow local type instead of by
 * augmenting the global `Navigator` — augmenting it would collide with
 * `NavigatorGPU.gpu`.
 */

/** The slice of the WebGPU API this module needs. */
interface GpuLike {
  requestAdapter?: (options?: unknown) => Promise<unknown>;
  getPreferredCanvasFormat?: () => string;
}

/** `navigator.gpu`, or `undefined` when the runtime has no WebGPU support. */
function gpu(): GpuLike | undefined {
  if (typeof navigator === "undefined") return undefined;
  return (navigator as { gpu?: GpuLike }).gpu;
}

export interface WebGpuSupport {
  available: boolean;
  reason?: string;
}

/**
 * Quick synchronous check — no promise, no device request.
 * Use for early UI branching (e.g. show/hide "WebGPU" badge).
 */
export function isWebGpuSupportedSync(): WebGpuSupport {
  if (!gpu()) {
    return { available: false, reason: "navigator.gpu absent" };
  }
  return { available: true };
}

/**
 * Full async check — requests an adapter to confirm the browser can
 * actually create a device (some browsers expose `navigator.gpu` but
 * fail at `requestAdapter` due to flags/hardware).
 */
export async function isWebGpuSupportedAsync(): Promise<WebGpuSupport> {
  const sync = isWebGpuSupportedSync();
  if (!sync.available) return sync;

  try {
    const adapter = await gpu()?.requestAdapter?.();
    if (!adapter) return { available: false, reason: "no adapter returned" };
    return { available: true };
  } catch (error) {
    return {
      available: false,
      reason: error instanceof Error ? error.message : "requestAdapter threw",
    };
  }
}

/**
 * Returns the best available power preference for the current device.
 * Prefers "high-performance" on desktop, "low-power" on mobile if detected.
 */
export function getPreferredPowerPreference(): "high-performance" | "low-power" {
  if (typeof navigator === "undefined") return "high-performance";
  const ua = navigator.userAgent.toLowerCase();
  const isMobile = /android|iphone|ipad|ipod|mobile/.test(ua);
  return isMobile ? "low-power" : "high-performance";
}
