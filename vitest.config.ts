import { defineConfig } from "vitest/config";
import path from "path";

// Dedicated test config (does NOT load the SWC React plugin — the current suite
// is pure-logic over src/lib, no DOM/JSX, so a plain node environment is faster
// and has zero browser deps). When component tests land later, add jsdom +
// the react plugin here (or a separate project) rather than widening this one.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.ts"],
  },
});
