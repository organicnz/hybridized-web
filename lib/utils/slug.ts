/**
 * Convert an artist name into a URL-safe slug.
 * Lowercases, replaces whitespace/slashes with hyphens and collapses repeats.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\s/]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Convert an artist name into a URL-safe, URI-encoded slug.
 */
export function slugifyEncoded(name: string): string {
  return encodeURIComponent(slugify(name));
}
