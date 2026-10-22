import { describe, expect, it, mock } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

/**
 * The pages that show when something else has already failed.
 *
 * They are the last thing standing when a page throws, so a crash in them is
 * a blank screen with no way back — and they had no test at all.
 */

mock.module("next/navigation", () => ({
  useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {} }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

const { default: ErrorPage } = await import("@/app/error");
const { default: GlobalErrorPage } = await import("@/app/global-error");
const { default: NotFound } = await import("@/app/not-found");

/** Set NODE_ENV, which is read-only on the environment object. */
function setNodeEnv(value: string | undefined): void {
  Object.defineProperty(process.env, "NODE_ENV", {
    value,
    configurable: true,
    writable: true,
    enumerable: true,
  });
}

describe("the error page", () => {
  it("says what happened and offers a way back", () => {
    const html = renderToStaticMarkup(
      createElement(ErrorPage, {
        error: Object.assign(new Error("boom"), { digest: "abc123" }),
        reset: () => {},
      }),
    );

    expect(html).toContain("Something went wrong");
    expect(html).toContain("Back to Home");
    expect(html).toContain("Try Again");
  });

  it("has a target for the skip link", () => {
    const html = renderToStaticMarkup(
      createElement(ErrorPage, { error: new Error("boom"), reset: () => {} }),
    );

    // The page has failed, and the root layout's "Skip to content" link
    // still has to land somewhere.
    expect(html).toContain('id="main-content"');
  });

  it("shows the message in development only", () => {
    const error = new Error("the secret detail");

    const original = process.env.NODE_ENV;

    try {
      setNodeEnv("production");
      const production = renderToStaticMarkup(createElement(ErrorPage, { error, reset: () => {} }));

      setNodeEnv("development");
      const development = renderToStaticMarkup(
        createElement(ErrorPage, { error, reset: () => {} }),
      );

      // The message is only for the developer; it is not shown in production.
      expect(production).not.toContain("the secret detail");
      expect(development).toContain("the secret detail");
    } finally {
      setNodeEnv(original);
    }
  });
});

describe("the global error page", () => {
  it("renders when the root layout itself has failed", () => {
    const html = renderToStaticMarkup(
      createElement(GlobalErrorPage, { error: new Error("boom"), reset: () => {} }),
    );

    expect(html).toContain("Something went wrong");
  });
});

describe("the not found page", () => {
  it("says the page is not there and offers a way back", () => {
    const html = renderToStaticMarkup(createElement(NotFound));

    expect(html).toContain("404");
    expect(html).toContain("Page not found");
    expect(html).toContain("Back to Home");
  });
});
