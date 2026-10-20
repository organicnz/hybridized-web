import { MemoryStorage } from "./memory-storage";

/**
 * The in-memory `localStorage` for this test file.
 *
 * Importing this module installs it on `globalThis`. `bun test --isolate`
 * gives every test file a fresh global, so a file that needs `localStorage`
 * has to install its own — a polyfill set up by another file is not visible.
 */
export const localStorage = new MemoryStorage();
globalThis.localStorage = localStorage;
