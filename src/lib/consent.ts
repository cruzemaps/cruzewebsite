// Cookie / analytics consent state for the public site.
//
// The only non-essential tracker the site loads is PostHog (src/lib/analytics.ts),
// which sets its own cookies and does autocapture. It must not load until a
// visitor opts in. This module is the single source of truth for that choice;
// it stays free of any analytics import so it can be unit-tested as pure logic.
//
// Storage: a per-browser localStorage flag. It is a convenience record of the
// visitor's choice, nothing more, so every read and write is wrapped in
// try/catch and the default when it is missing or unreadable is "no consent
// yet", which keeps analytics OFF. There is no essential-cookie toggle because
// the essential storage the site uses (Supabase auth token, the apply-form
// draft, the investor visit/session keys) is required for the features the
// visitor is actively using and carries no separate opt-in under the cookie
// rules we are modelling.

export type ConsentValue = "accepted" | "declined";

const STORAGE_KEY = "cruze_cookie_consent_v1";
const CHANGE_EVENT = "cruze-consent-change";

export function getConsent(): ConsentValue | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "accepted" || v === "declined" ? v : null;
  } catch {
    return null;
  }
}

// True only when the visitor has actively accepted. A missing, declined, or
// unreadable value all return false, so analytics defaults to off.
export function hasAnalyticsConsent(): boolean {
  return getConsent() === "accepted";
}

export function setConsent(value: ConsentValue): void {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Storage unavailable (private mode, blocked). The choice still takes effect
    // for this page load via the event below; it just will not be remembered.
  }
  try {
    window.dispatchEvent(new CustomEvent<ConsentValue>(CHANGE_EVENT, { detail: value }));
  } catch {
    // No window (e.g. a non-DOM test env). Nothing to notify.
  }
}

// Subscribe to consent changes made elsewhere on the page (the banner, or the
// manage-preferences control on the cookie page). Returns an unsubscribe fn.
export function onConsentChange(fn: (value: ConsentValue) => void): () => void {
  const handler = (e: Event) => fn((e as CustomEvent<ConsentValue>).detail);
  try {
    window.addEventListener(CHANGE_EVENT, handler);
  } catch {
    return () => undefined;
  }
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}
