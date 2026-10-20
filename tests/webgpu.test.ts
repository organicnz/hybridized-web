import { afterEach, describe, expect, it } from "bun:test";
import {
  getPreferredPowerPreference,
  isWebGpuSupportedAsync,
  isWebGpuSupportedSync,
} from "@/lib/webgpu";

/**
 * WebGPU feature detection.
 *
 * `navigator` is a configurable, writable data property in Bun, so every
 * branch can be exercised directly — no browser, no GPU, no device request.
 */

const originalNavigator = globalThis.navigator;

function setNavigator(value: unknown): void {
  Object.defineProperty(globalThis, "navigator", {
    value,
    configurable: true,
    writable: true,
  });
}

function removeNavigator(): void {
  Reflect.deleteProperty(globalThis, "navigator");
}

afterEach(() => {
  setNavigator(originalNavigator);
});

describe("the shape of the result, whatever the environment", () => {
  // The branch tests below pin the exact values; this one holds for any
  // navigator, including the real one.
  it("returns an object with an available boolean", () => {
    const result = isWebGpuSupportedSync();
    expect(typeof result.available).toBe("boolean");
    if (!result.available) {
      expect(typeof result.reason).toBe("string");
    }
  });

  it("returns a valid power preference string", () => {
    const pref = getPreferredPowerPreference();
    expect(["high-performance", "low-power"]).toContain(pref);
  });
});

describe("isWebGpuSupportedSync", () => {
  it("reports unavailable when navigator.gpu is absent", () => {
    setNavigator({});

    expect(isWebGpuSupportedSync()).toEqual({
      available: false,
      reason: "navigator.gpu absent",
    });
  });

  it("reports unavailable when there is no navigator at all", () => {
    removeNavigator();

    expect(isWebGpuSupportedSync()).toEqual({
      available: false,
      reason: "navigator.gpu absent",
    });
  });

  it("reports available when navigator.gpu is present", () => {
    setNavigator({ gpu: {} });

    expect(isWebGpuSupportedSync()).toEqual({ available: true });
  });
});

describe("isWebGpuSupportedAsync", () => {
  it("confirms a device when an adapter comes back", async () => {
    setNavigator({ gpu: { requestAdapter: async () => ({}) } });

    expect(await isWebGpuSupportedAsync()).toEqual({ available: true });
  });

  it("reports when no adapter is returned", async () => {
    setNavigator({ gpu: { requestAdapter: async () => null } });

    expect(await isWebGpuSupportedAsync()).toEqual({
      available: false,
      reason: "no adapter returned",
    });
  });

  it("reports the error when requestAdapter throws", async () => {
    setNavigator({
      gpu: {
        requestAdapter: async () => {
          throw new Error("adapter unavailable");
        },
      },
    });

    expect(await isWebGpuSupportedAsync()).toEqual({
      available: false,
      reason: "adapter unavailable",
    });
  });

  it("reports a throw that is not an Error", async () => {
    setNavigator({
      gpu: {
        requestAdapter: async () => {
          throw "something else";
        },
      },
    });

    expect(await isWebGpuSupportedAsync()).toEqual({
      available: false,
      reason: "requestAdapter threw",
    });
  });

  it("is unavailable when navigator.gpu is absent", async () => {
    setNavigator({});

    expect(await isWebGpuSupportedAsync()).toEqual({
      available: false,
      reason: "navigator.gpu absent",
    });
  });
});

describe("getPreferredPowerPreference", () => {
  it("prefers high performance on the desktop", () => {
    setNavigator({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" });

    expect(getPreferredPowerPreference()).toBe("high-performance");
  });

  it("prefers low power on mobile", () => {
    setNavigator({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)" });

    expect(getPreferredPowerPreference()).toBe("low-power");
  });

  it("defaults to high performance without a navigator", () => {
    removeNavigator();

    expect(getPreferredPowerPreference()).toBe("high-performance");
  });
});
