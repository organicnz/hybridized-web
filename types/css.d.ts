/**
 * Ambient declarations for the stylesheets the app imports.
 *
 * Next.js handles the CSS itself at build time; this only teaches the type
 * checker that the import resolves. Without it, a checker that enforces
 * `noUncheckedSideEffectImports` rejects the side-effect import — `tsc`
 * leaves that option off by default, Bun's checker does not.
 */

declare module "*.css";
