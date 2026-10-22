// Bridges a consent choice to the analytics layer. Kept separate from
// consent.ts (which stays import-free and unit-tested) and from the React
// components, so both the banner and the cookie-page preference control apply a
// choice the same way.
import { initAnalytics, resetAnalytics, trackPageview } from "@/lib/analytics";
import { setConsent, type ConsentValue } from "@/lib/consent";

export function applyConsentChoice(value: ConsentValue): void {
  setConsent(value);
  if (value === "accepted") {
    // PostHog only actually boots if VITE_POSTHOG_KEY is configured; initAnalytics
    // is a no-op otherwise and is safe to call more than once.
    initAnalytics();
    try {
      trackPageview(window.location.pathname + window.location.search);
    } catch {
      // Non-fatal: the next route change records the pageview.
    }
  } else {
    // Clears any PostHog identity/cookies if it had been initialised earlier in
    // this page's life. Safe no-op when analytics never started.
    resetAnalytics();
  }
}
