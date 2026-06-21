import { defineConfig } from "vitest/config";

// The sim regression suite: pure-lib/clock-seam unit tests + deterministic replay of recorded
// transcripts. Node environment so the in-memory localStorage shim (not jsdom) controls storage.
export default defineConfig({
  test: {
    include: ["sim/**/*.test.ts"],
    environment: "node",
    globals: true,
  },
});
