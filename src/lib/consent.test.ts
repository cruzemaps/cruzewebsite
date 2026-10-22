// @vitest-environment jsdom
//
// Consent defaults to OFF: analytics must never run until a visitor actively
// accepts. These tests lock that default and the read/write round-trip.
import { afterEach, describe, expect, it, vi } from "vitest";
import { getConsent, hasAnalyticsConsent, onConsentChange, setConsent } from "./consent";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("consent default", () => {
  it("is null (no choice) before the visitor decides", () => {
    expect(getConsent()).toBeNull();
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("treats an unreadable store as no consent", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(getConsent()).toBeNull();
    expect(hasAnalyticsConsent()).toBe(false);
  });
});

describe("setConsent", () => {
  it("persists and reads back acceptance", () => {
    setConsent("accepted");
    expect(getConsent()).toBe("accepted");
    expect(hasAnalyticsConsent()).toBe(true);
  });

  it("persists and reads back a decline", () => {
    setConsent("declined");
    expect(getConsent()).toBe("declined");
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("does not throw when storage write fails", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => setConsent("accepted")).not.toThrow();
  });
});

describe("onConsentChange", () => {
  it("fires subscribers on a change and can unsubscribe", () => {
    const seen: string[] = [];
    const off = onConsentChange((v) => seen.push(v));
    setConsent("accepted");
    setConsent("declined");
    off();
    setConsent("accepted");
    expect(seen).toEqual(["accepted", "declined"]);
  });
});
