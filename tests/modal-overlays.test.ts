import { describe, expect, it } from "bun:test";

const COMPONENTS = "components";

const files = [...new Bun.Glob(`${COMPONENTS}/**/*.tsx`).scanSync({ cwd: "." })];

describe("modal overlay safety", () => {
  it("finds component files", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("a <dialog> is never rendered while closed", async () => {
    const offenders: string[] = [];

    for (const file of files) {
      const source = await Bun.file(file).text();
      if (!/<dialog/.test(source)) continue;

      // A <dialog> must be gated behind `if (!isOpen) return null` (or an
      // equivalent conditional) before it is returned. Author `display`
      // utilities beat the UA's `dialog:not([open]) { display: none }`, so an
      // always-mounted dialog becomes a full-viewport click trap.
      const hasGuard = /if \(!isOpen\) return null;/.test(source);
      const guardedAtRender = /\{isOpen &&\s*<AuthRequiredModal/.test(source);
      if (!hasGuard && !guardedAtRender) offenders.push(file);
    }

    expect(offenders).toEqual([]);
  });

  it("the per-episode player does not mount a modal per instance", async () => {
    const source = await Bun.file("components/iframe-player.tsx").text();
    // IframePlayer renders once per episode, so an unconditional modal here
    // produced one overlay per row across the whole page.
    expect(source).toMatch(/\{showAuthModal &&/);
  });
});
