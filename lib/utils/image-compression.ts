/**
 * The size an image should be resized to, keeping its aspect ratio.
 *
 * A landscape image is bounded by its width and a portrait one by its
 * height, and an image that already fits is left alone.
 *
 * It is a function of its arguments rather than a block inside the reader
 * callback, because it is the part with the arithmetic in it — and the part
 * that has to be right for the image not to be stretched.
 */
export function fitDimensions(
  width: number,
  height: number,
  maxWidth = 800,
  maxHeight = 800,
): { width: number; height: number } {
  if (width > height) {
    if (width > maxWidth) {
      return { width: maxWidth, height: (height * maxWidth) / width };
    }
  } else if (height > maxHeight) {
    return { width: (width * maxHeight) / height, height: maxHeight };
  }

  return { width, height };
}

/**
 * Compress an image file to reduce size while maintaining quality
 * @param file - The image file to compress
 * @param maxWidth - Maximum width in pixels (default: 800)
 * @param maxHeight - Maximum height in pixels (default: 800)
 * @param quality - JPEG quality 0-1 (default: 0.8)
 * @returns Compressed image as Blob
 */
export async function compressImage(
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.8,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        const { width, height } = fitDimensions(img.width, img.height, maxWidth, maxHeight);

        // Create canvas and draw resized image
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to compress image"));
            }
          },
          "image/jpeg",
          quality,
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Validate image file type and size
 * @param file - The file to validate
 * @param maxSizeMB - Maximum file size in MB (default: 5)
 * @returns Error message if invalid, null if valid
 */
export function validateImageFile(file: File, maxSizeMB = 5): string | null {
  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (!validTypes.includes(file.type)) {
    return "Please upload a valid image file (JPEG, PNG, or WebP)";
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return `Image size must be less than ${maxSizeMB}MB`;
  }

  return null;
}
