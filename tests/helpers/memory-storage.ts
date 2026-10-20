/**
 * An in-memory `Storage` for tests.
 *
 * `bun test` runs in a runtime with no DOM, so there is no `localStorage`.
 * This is the smallest thing that behaves like one: the subset the app uses
 * — `length`, `key`, `getItem`, `setItem`, `removeItem` and `clear`.
 */
export class MemoryStorage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null;
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}
