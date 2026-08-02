import { defineConfig } from "vitest/config";
import path from "path";

// Frontend unit tests come in two flavours:
//   - src/lib/*.test.ts        — pure logic, run in a plain Node environment
//     (fast, no DOM). This is the default `environment` below.
//   - src/**/*.test.tsx        — React component tests that need a DOM. Each
//     such file opts into jsdom with a `// @vitest-environment jsdom` docblock
//     at the top, so the pure-logic suite keeps running in Node and never pays
//     the jsdom startup cost.
// `esbuild.jsx: "automatic"` gives the .tsx files the React 17+ automatic JSX
// runtime (matching tsconfig's `jsx: "react-jsx"`), so component tests don't
// need to `import React`. We avoid the SWC react plugin on purpose — esbuild's
// transform is enough for tests and keeps the config dependency-light. The `@`
// alias mirrors vite.config.ts / tsconfig so imports resolve identically to the
// app build.
export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Polyfills jsdom-missing layout APIs (ResizeObserver, matchMedia) that
    // Radix primitives touch on mount. No-op for the node-env lib suite.
    setupFiles: ["./src/test/setup-dom.ts"],
  },
});
