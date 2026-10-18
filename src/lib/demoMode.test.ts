// @vitest-environment jsdom
//
// The demo session must not exist in production builds. vi.stubEnv flips
// import.meta.env.DEV the same way `vite build` does.
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearDemoSession,
  demoModeEnabled,
  getDemoRole,
  getDemoStatus,
  getImpersonatedUserId,
  isDemoSession,
  setDemoSession,
} from "./demoMode";

afterEach(() => {
  vi.unstubAllEnvs();
  sessionStorage.clear();
  localStorage.clear();
});

describe("production build (DEV=false)", () => {
  it("ignores demo keys planted in sessionStorage", () => {
    vi.stubEnv("DEV", false);
    sessionStorage.setItem("demo_role", "admin");
    sessionStorage.setItem("demo_status", "active");
    sessionStorage.setItem("impersonated_user_id", "00000000-0000-0000-0000-000000000001");

    expect(demoModeEnabled()).toBe(false);
    expect(getDemoRole()).toBeNull();
    expect(isDemoSession()).toBe(false);
    expect(getDemoStatus()).toBeNull();
    expect(getImpersonatedUserId()).toBeNull();
  });

  it("cannot start a demo session", () => {
    vi.stubEnv("DEV", false);
    setDemoSession("admin", { status: "active", impersonatedUserId: "x" });
    expect(sessionStorage.length).toBe(0);
  });
});

describe("dev build (DEV=true)", () => {
  it("round-trips a demo session in sessionStorage only", () => {
    vi.stubEnv("DEV", true);
    setDemoSession("fleet_owner", { status: "approved", impersonatedUserId: "abc" });
    expect(getDemoRole()).toBe("fleet_owner");
    expect(getDemoStatus()).toBe("approved");
    expect(getImpersonatedUserId()).toBe("abc");
    expect(localStorage.length).toBe(0);

    clearDemoSession();
    expect(isDemoSession()).toBe(false);
    expect(sessionStorage.length).toBe(0);
  });

  it("rejects unknown roles", () => {
    vi.stubEnv("DEV", true);
    sessionStorage.setItem("demo_role", "superuser");
    expect(getDemoRole()).toBeNull();
  });

  it("never reads demo state from localStorage", () => {
    vi.stubEnv("DEV", true);
    localStorage.setItem("demo_role", "admin");
    expect(getDemoRole()).toBeNull();
  });
});
