// Pure-logic tests for the analytics wrapper (fast Node env — no DOM).
//
// analytics.ts is a thin gate over posthog-js: EVERY exported function is a
// no-op until initAnalytics() has run, and the flag readers narrow posthog's
// loosely-typed return values (isFeatureEnabled can return a string for a
// multivariate flag; getFeatureFlag can return a boolean). Those two guards are
// load-bearing — without the `initialized` gate we'd fire events/identify calls
// at an uninitialised posthog (errors / dropped data), and without the type
// narrowing a multivariate variant string would read as "flag enabled". This
// suite pins the gate + the narrowing by mocking posthog-js and asserting both
// the no-op-before-init and pass-through-after-init behaviour of each function.
//
// Module-level `let initialized` is per-import, so each test re-imports the
// module fresh via load() (vi.resetModules) to start from the uninitialised
// state; the mocked posthog object is shared by reference and cleared per test.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ph = {
  init: vi.fn(),
  capture: vi.fn(),
  identify: vi.fn(),
  reset: vi.fn(),
  isFeatureEnabled: vi.fn(),
  getFeatureFlag: vi.fn(),
  onFeatureFlags: vi.fn(),
};

vi.mock("posthog-js", () => ({ default: ph }));

type Analytics = typeof import("./analytics");

// Fresh module so `initialized` resets to false; same mocked posthog by ref.
async function load(): Promise<Analytics> {
  vi.resetModules();
  return import("./analytics");
}

// Load AND initialise (stubs a key so initAnalytics flips `initialized` true).
async function loadInitialized(): Promise<Analytics> {
  vi.stubEnv("VITE_POSTHOG_KEY", "phc_test_key");
  const a = await load();
  a.initAnalytics();
  expect(ph.init).toHaveBeenCalledTimes(1);
  ph.init.mockClear();
  return a;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("initAnalytics", () => {
  it("no-ops without a VITE_POSTHOG_KEY (dev mode without a key works)", async () => {
    const a = await load();
    a.initAnalytics();
    expect(ph.init).not.toHaveBeenCalled();
    // And because init never ran, downstream calls stay inert.
    a.track("hero_cta_click");
    expect(ph.capture).not.toHaveBeenCalled();
  });

  it("initialises posthog with the key and the expected config", async () => {
    vi.stubEnv("VITE_POSTHOG_KEY", "phc_abc");
    const a = await load();
    a.initAnalytics();
    expect(ph.init).toHaveBeenCalledTimes(1);
    const [key, config] = ph.init.mock.calls[0];
    expect(key).toBe("phc_abc");
    expect(config).toMatchObject({
      api_host: "https://us.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: false,
      capture_pageleave: true,
      autocapture: true,
    });
  });

  it("uses VITE_POSTHOG_HOST when provided, else the US default", async () => {
    vi.stubEnv("VITE_POSTHOG_KEY", "phc_abc");
    vi.stubEnv("VITE_POSTHOG_HOST", "https://eu.i.posthog.com");
    const a = await load();
    a.initAnalytics();
    expect(ph.init.mock.calls[0][1]).toMatchObject({
      api_host: "https://eu.i.posthog.com",
    });
  });

  it("is idempotent — a second call does not re-init", async () => {
    vi.stubEnv("VITE_POSTHOG_KEY", "phc_abc");
    const a = await load();
    a.initAnalytics();
    a.initAnalytics();
    expect(ph.init).toHaveBeenCalledTimes(1);
  });
});

describe("before init — every function is inert", () => {
  it("trackPageview / track / identifyUser / resetAnalytics no-op", async () => {
    const a = await load();
    a.trackPageview("/x");
    a.track("roi_calc_used", { region: "TX" });
    a.identifyUser("u1", { plan: "pro" });
    a.resetAnalytics();
    expect(ph.capture).not.toHaveBeenCalled();
    expect(ph.identify).not.toHaveBeenCalled();
    expect(ph.reset).not.toHaveBeenCalled();
  });

  it("isFlagEnabled is false and getFlagVariant is undefined (no posthog read)", async () => {
    const a = await load();
    expect(a.isFlagEnabled("show_live_counter")).toBe(false);
    expect(a.getFlagVariant("hero_copy_v2")).toBeUndefined();
    expect(ph.isFeatureEnabled).not.toHaveBeenCalled();
    expect(ph.getFeatureFlag).not.toHaveBeenCalled();
  });
});

describe("after init — pass-through to posthog", () => {
  it("trackPageview captures $pageview with $current_url", async () => {
    const a = await loadInitialized();
    a.trackPageview("/for-fleets");
    expect(ph.capture).toHaveBeenCalledWith("$pageview", {
      $current_url: "/for-fleets",
    });
  });

  it("track forwards the event name and props (props optional)", async () => {
    const a = await loadInitialized();
    a.track("application_submitted", { step: 3 });
    expect(ph.capture).toHaveBeenCalledWith("application_submitted", { step: 3 });

    ph.capture.mockClear();
    a.track("hero_cta_click");
    expect(ph.capture).toHaveBeenCalledWith("hero_cta_click", undefined);
  });

  it("identifyUser forwards id and traits; resetAnalytics calls reset", async () => {
    const a = await loadInitialized();
    a.identifyUser("user-42", { plan: "fleet" });
    expect(ph.identify).toHaveBeenCalledWith("user-42", { plan: "fleet" });
    a.resetAnalytics();
    expect(ph.reset).toHaveBeenCalledTimes(1);
  });
});

describe("isFlagEnabled — strict boolean narrowing", () => {
  it("true only when posthog returns exactly true", async () => {
    const a = await loadInitialized();
    ph.isFeatureEnabled.mockReturnValue(true);
    expect(a.isFlagEnabled("investor_gate_required")).toBe(true);
    expect(ph.isFeatureEnabled).toHaveBeenCalledWith("investor_gate_required");
  });

  it("false for false / undefined / a truthy non-boolean (a variant string)", async () => {
    const a = await loadInitialized();
    ph.isFeatureEnabled.mockReturnValue(false);
    expect(a.isFlagEnabled("show_live_counter")).toBe(false);
    ph.isFeatureEnabled.mockReturnValue(undefined);
    expect(a.isFlagEnabled("show_live_counter")).toBe(false);
    // A multivariate flag can come back as a non-empty string; the `=== true`
    // guard must NOT treat that truthy value as "enabled".
    ph.isFeatureEnabled.mockReturnValue("variant-a");
    expect(a.isFlagEnabled("show_live_counter")).toBe(false);
  });
});

describe("getFlagVariant — string narrowing", () => {
  it("returns the variant when posthog returns a string", async () => {
    const a = await loadInitialized();
    ph.getFeatureFlag.mockReturnValue("orange");
    expect(a.getFlagVariant("fleet_cta_orange_vs_cyan")).toBe("orange");
    expect(ph.getFeatureFlag).toHaveBeenCalledWith("fleet_cta_orange_vs_cyan");
  });

  it("returns undefined for a boolean / undefined (boolean flag, not multivariate)", async () => {
    const a = await loadInitialized();
    ph.getFeatureFlag.mockReturnValue(true);
    expect(a.getFlagVariant("hero_copy_v2")).toBeUndefined();
    ph.getFeatureFlag.mockReturnValue(undefined);
    expect(a.getFlagVariant("hero_copy_v2")).toBeUndefined();
  });
});
