import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { compressImage, fitDimensions, validateImageFile } from "@/lib/utils/image-compression";

/**
 * The image upload check, and the resize the avatar goes through.
 *
 * The avatar picker compresses an image in the browser and sends it, and the
 * file has to be an image and it has to be within the limit — the second
 * one matters, because the upload is a body the server has to read.
 */

/** A file of a given type and size. */
function fileOf(type: string, sizeBytes: number): File {
  return new File([new Uint8Array(sizeBytes)], "avatar", { type });
}

describe("validateImageFile", () => {
  it("accepts an image", () => {
    expect(validateImageFile(fileOf("image/jpeg", 1024))).toBeNull();
    expect(validateImageFile(fileOf("image/png", 1024))).toBeNull();
    expect(validateImageFile(fileOf("image/webp", 1024))).toBeNull();
  });

  it("rejects a file that is not an image", () => {
    const message = validateImageFile(fileOf("application/pdf", 1024));

    expect(message).toContain("valid image file");
  });

  it("rejects a file that is too big", () => {
    const message = validateImageFile(fileOf("image/png", 6 * 1024 * 1024));

    expect(message).toBe("Image size must be less than 5MB");
  });

  it("takes the limit as an argument", () => {
    const message = validateImageFile(fileOf("image/png", 2 * 1024 * 1024), 1);

    expect(message).toBe("Image size must be less than 1MB");
  });

  it("accepts a file that is exactly at the limit", () => {
    expect(validateImageFile(fileOf("image/png", 5 * 1024 * 1024))).toBeNull();
  });
});

describe("fitDimensions", () => {
  it("leaves an image that already fits alone", () => {
    expect(fitDimensions(400, 300)).toEqual({ width: 400, height: 300 });
  });

  it("bounds a landscape image by its width", () => {
    expect(fitDimensions(1600, 800)).toEqual({ width: 800, height: 400 });
  });

  it("bounds a portrait image by its height", () => {
    expect(fitDimensions(800, 1600)).toEqual({ width: 400, height: 800 });
  });

  it("keeps the aspect ratio", () => {
    const { width, height } = fitDimensions(2000, 1000);

    expect(width / height).toBe(2);
  });

  it("takes the bounds as arguments", () => {
    expect(fitDimensions(1000, 500, 200, 200)).toEqual({ width: 200, height: 100 });
  });
});

/**
 * The browser the compressor runs in.
 *
 * `FileReader`, `Image` and a canvas are the three things it needs, and all
 * three are faked here: what is under test is the sequence and the errors,
 * not the browser.
 */
let imageWidth = 1600;
let imageHeight = 800;
let imageFails = false;
let readerFails = false;
let canvasHasContext = true;
let blobFails = false;
let drawn: { width: number; height: number } | null = null;

const ORIGINAL = {
  FileReader: globalThis.FileReader,
  Image: globalThis.Image,
  document: globalThis.document,
};

beforeEach(() => {
  imageWidth = 1600;
  imageHeight = 800;
  imageFails = false;
  readerFails = false;
  canvasHasContext = true;
  blobFails = false;
  drawn = null;

  Object.defineProperty(globalThis, "FileReader", {
    value: class {
      onload: ((event: unknown) => void) | null = null;
      onerror: (() => void) | null = null;

      readAsDataURL(): void {
        if (readerFails) {
          this.onerror?.();
          return;
        }
        this.onload?.({ target: { result: "data:image/png;base64," } });
      }
    },
    configurable: true,
    writable: true,
  });

  Object.defineProperty(globalThis, "Image", {
    value: class {
      width = imageWidth;
      height = imageHeight;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_value: string) {
        if (imageFails) this.onerror?.();
        else this.onload?.();
      }
    },
    configurable: true,
    writable: true,
  });

  Object.defineProperty(globalThis, "document", {
    value: {
      createElement: () => ({
        width: 0,
        height: 0,
        getContext: () =>
          canvasHasContext
            ? {
                drawImage: (
                  _image: unknown,
                  _x: number,
                  _y: number,
                  width: number,
                  height: number,
                ) => {
                  drawn = { width, height };
                },
              }
            : null,
        toBlob: (callback: (blob: Blob | null) => void) => {
          callback(blobFails ? null : new Blob(["compressed"]));
        },
      }),
    },
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  for (const [name, value] of Object.entries(ORIGINAL)) {
    Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
  }
});

describe("compressImage", () => {
  it("resizes the image and returns a blob", async () => {
    const blob = await compressImage(fileOf("image/png", 1024));

    expect(blob).toBeInstanceOf(Blob);
    expect(drawn).toEqual({ width: 800, height: 400 });
  });

  it("rejects when the image cannot be read", async () => {
    readerFails = true;

    expect(compressImage(fileOf("image/png", 1024))).rejects.toThrow("Failed to read file");
  });

  it("rejects when the image cannot be loaded", async () => {
    imageFails = true;

    expect(compressImage(fileOf("image/png", 1024))).rejects.toThrow("Failed to load image");
  });

  it("rejects when the canvas has no context", async () => {
    canvasHasContext = false;

    expect(compressImage(fileOf("image/png", 1024))).rejects.toThrow(
      "Failed to get canvas context",
    );
  });

  it("rejects when the canvas produces no blob", async () => {
    blobFails = true;

    expect(compressImage(fileOf("image/png", 1024))).rejects.toThrow("Failed to compress image");
  });
});
