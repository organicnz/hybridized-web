import { describe, expect, it } from "bun:test";
import { EQ_PRESETS, SPATIAL_PRESETS } from "@/lib/audio-presets";

describe("EQ_PRESETS", () => {
  it("has presets available", () => {
    expect(EQ_PRESETS.length).toBeGreaterThan(0);
  });

  it("every preset has exactly 10 bands", () => {
    for (const preset of EQ_PRESETS) {
      expect(preset.bands).toHaveLength(10);
    }
  });

  it("every band value stays within the supported range", () => {
    for (const preset of EQ_PRESETS) {
      for (const band of preset.bands) {
        expect(band).toBeGreaterThanOrEqual(-12);
        expect(band).toBeLessThanOrEqual(12);
      }
    }
  });

  it("has unique preset names", () => {
    const names = EQ_PRESETS.map((preset) => preset.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("every preset has a name and description", () => {
    for (const preset of EQ_PRESETS) {
      expect(preset.name.length).toBeGreaterThan(0);
      expect(preset.description.length).toBeGreaterThan(0);
    }
  });
});

describe("SPATIAL_PRESETS", () => {
  it("has presets available", () => {
    expect(SPATIAL_PRESETS.length).toBeGreaterThan(0);
  });

  it("every preset has a valid 3D position", () => {
    for (const preset of SPATIAL_PRESETS) {
      expect(Number.isFinite(preset.position.x)).toBe(true);
      expect(Number.isFinite(preset.position.y)).toBe(true);
      expect(Number.isFinite(preset.position.z)).toBe(true);
    }
  });

  it("has unique preset names", () => {
    const names = SPATIAL_PRESETS.map((preset) => preset.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
