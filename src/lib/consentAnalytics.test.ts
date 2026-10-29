// @vitest-environment jsdom
//
// consentAnalytics.ts is the one bridge that turns a consent choice into
// analytics side effects, so its branch is privacy-load-bearing: "accepted"
// must boot analytics + record the current pageview, and anything else ("declined")
// must NOT boot analytics and MUST reset any identity/cookies that a prior
// "accepted" left behind. A regression that inverted or dropped either branch
// would either track visitors who declined or silently stop tracking those who
// opted in, and nothing else in the app re-checks this mapping.
//
// We mock the two collaborators (consent.ts persists the choice; analytics.ts
// wraps posthog) and assert the bridge's contract: which collaborator runs on
// each choice, that setConsent always persists first, that the pageview carries
// the full path+query, and that a throwing trackPageview is swallowed (the next
// route change records the pageview instead).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const setConsent = vi.fn();
const initAnalytics = vi.fn();
const resetAnalytics = vi.fn();
const trackPageview = vi.fn();

vi.mock("@/lib/consent", () => ({ setConsent: (...a: unknown[]) => setConsent(...a) }));
vi.mock("@/lib/analytics", () => ({
  initAnalytics: (...a: unknown[]) => initAnalytics(...a),
  resetAnalytics: (...a: unknown[]) => resetAnalytics(...a),
  trackPageview: (...a: unknown[]) => trackPageview(...a),
}));

import { applyConsentChoice } from "./consentAnalytics";

beforeEach(() => {
  window.history.replaceState({}, "", "/");
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("applyConsentChoice", () => {
  it("accepting persists the choice, boots analytics, and records the pageview; never resets", () => {
    applyConsentChoice("accepted");

    expect(setConsent).toHaveBeenCalledWith("accepted");
    expect(initAnalytics).toHaveBeenCalledTimes(1);
    expect(trackPageview).toHaveBeenCalledTimes(1);
    expect(resetAnalytics).not.toHaveBeenCalled();
  });

  it("declining persists the choice and resets analytics; never boots or tracks (fail-closed)", () => {
    applyConsentChoice("declined");

    expect(setConsent).toHaveBeenCalledWith("declined");
    expect(resetAnalytics).toHaveBeenCalledTimes(1);
    expect(initAnalytics).not.toHaveBeenCalled();
    expect(trackPageview).not.toHaveBeenCalled();
  });

  it("persists the consent choice before touching analytics on both branches", () => {
    applyConsentChoice("accepted");
    expect(setConsent.mock.invocationCallOrder[0]).toBeLessThan(
      initAnalytics.mock.invocationCallOrder[0],
    );

    vi.clearAllMocks();

    applyConsentChoice("declined");
    expect(setConsent.mock.invocationCallOrder[0]).toBeLessThan(
      resetAnalytics.mock.invocationCallOrder[0],
    );
  });

  it("records the full path and query string of the current location on accept", () => {
    window.history.replaceState({}, "", "/cameras?region=houston&v=2");

    applyConsentChoice("accepted");

    expect(trackPageview).toHaveBeenCalledWith("/cameras?region=houston&v=2");
  });

  it("swallows a throwing trackPageview so accepting still persists and boots", () => {
    trackPageview.mockImplementationOnce(() => {
      throw new Error("posthog not ready");
    });

    expect(() => applyConsentChoice("accepted")).not.toThrow();
    expect(setConsent).toHaveBeenCalledWith("accepted");
    expect(initAnalytics).toHaveBeenCalledTimes(1);
  });
});
