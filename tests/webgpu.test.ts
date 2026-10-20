import { describe, expect, it } from "bun:test";
import {
  getPreferredPowerPreference,
  isWebGpuSupportedAsync,
  isWebGpuSupportedSync,
} from "@/lib/webgpu";

describe("isWebGpuSupportedSync", () => {
  it("returns an object with available boolean", () => {
    const result = isWebGpuSupportedSync();
    expect(typeof result.available).toBe("boolean");
    if (!result.available) {
      expect(typeof result.reason).toBe("string");
    }
  });
});

describe("getPreferredPowerPreference", () => {
  it("returns a valid power preference string", () => {
    const pref = getPreferredPowerPreference();
    expect(["high-performance", "low-power"]).toContain(pref);
  });
});

describe("isWebGpuSupportedAsync", () => {
  it("resolves to an object with available boolean", async () => {
    const result = await isWebGpuSupportedAsync();
    expect(typeof result.available).toBe("boolean");
    if (!result.available) {
      expect(typeof result.reason).toBe("string");
    }
  });
});
