/**
 * The animation components, and the features they need.
 *
 * framer-motion ships two renderers. The full one can do layout animations,
 * gestures and drag; the mini one does the ordinary animations — fades,
 * slides, scales and their staggers — and the app uses only those. The full
 * renderer was a hundred and ten kilobytes of the JavaScript every page
 * downloads; the mini one is a fraction of that.
 *
 * The features are loaded separately, after the page. An element starts
 * invisible and fades in when they arrive, which is what the animation does
 * anyway, so nothing appears that should not — the animation simply begins a
 * moment later, and the page is interactive before it does.
 */
export { AnimatePresence, m } from "framer-motion";

/**
 * The features the mini renderer needs.
 *
 * They are imported here rather than in the component that uses them, so
 * that every animated component on the page shares one copy.
 */
export { domAnimation } from "framer-motion";
