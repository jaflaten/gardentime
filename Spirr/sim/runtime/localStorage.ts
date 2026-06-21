// In-memory localStorage polyfill for Node. The app's persistence seam (src/lib/storage.ts) and the
// three Zustand stores read `localStorage` at module-init, so this must be installed on globalThis
// *before* those modules are imported (see bootstrap.ts — dynamic import after install).

export interface MemoryStorage extends Storage {
  /** Raw view of the backing map — handy for assertions/snapshots in tests. */
  dump(): Record<string, string>;
}

export function createMemoryStorage(seed?: Record<string, string>): MemoryStorage {
  const map = new Map<string, string>(Object.entries(seed ?? {}));
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    setItem(key: string, value: string) {
      map.set(key, String(value));
    },
    removeItem(key: string) {
      map.delete(key);
    },
    key(index: number) {
      return Array.from(map.keys())[index] ?? null;
    },
    dump() {
      return Object.fromEntries(map);
    },
  };
}

/**
 * Install a fresh in-memory localStorage on globalThis. Idempotent per call (replaces any prior one).
 * Uses defineProperty so it reliably overrides Node 25's built-in `localStorage` accessor (a plain
 * assignment to a getter-only property is a no-op in sloppy mode / throws in strict).
 */
export function installMemoryStorage(seed?: Record<string, string>): MemoryStorage {
  const storage = createMemoryStorage(seed);
  Object.defineProperty(globalThis, "localStorage", {
    value: storage,
    writable: true,
    configurable: true,
  });
  return storage;
}
