// Vitest setup, applied to every test file. jsdom does not implement a handful
// of layout/observer APIs that Radix UI primitives (e.g. the Slider used in the
// ROI calculator) touch on mount. We stub them with inert no-ops so component
// tests can render without a real layout engine. This is a no-op in the
// pure-logic (node-environment) lib suite — defining a global it never reads is
// harmless — and it never overrides a real implementation if one exists.
if (typeof globalThis.ResizeObserver === "undefined") {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}

if (typeof globalThis.matchMedia === "undefined" && typeof window !== "undefined") {
  // Minimal matchMedia that reports "no match"; enough for components that probe
  // a media query at mount without driving responsive behaviour in tests.
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
