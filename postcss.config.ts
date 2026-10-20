/**
 * PostCSS configuration.
 *
 * Tailwind CSS 4 does its own vendor prefixing, so there is no
 * `autoprefixer` here — v4 prefixes on its own.
 *
 * `postcss-load-config` is bundled inside Next.js rather than installed, so
 * its `Config` type is not importable. The shape below is the part of it this
 * file uses, which keeps the config type-checked without adding a dependency
 * just for one type.
 */
interface PostcssConfig {
  /** Plugin name mapped to that plugin's options. */
  plugins: Record<string, Record<string, unknown> | undefined>;
}

const config: PostcssConfig = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
