// Thin wrapper around posthog-js. Pass-through on init failure so dev mode
// without an API key works fine. Wire VITE_POSTHOG_KEY in Cloudflare Pages
// env settings to enable.

import posthog from "posthog-js";

let initialized = false;

export function initAnalytics() {
  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  if (!key || initialized) return;
  posthog.init(key, {
    api_host: (import.meta.env.VITE_POSTHOG_HOST as string) || "https://us.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: true,
  });
  initialized = true;
}

export function trackPageview(path: string) {
  if (!initialized) return;
  posthog.capture("$pageview", { $current_url: path });
}

// Funnel events. Add new ones here so call sites stay typed.
type FunnelEvent =
  | "hero_cta_click"
  | "demo_role_activated"
  | "roi_calc_used"
  | "fleet_cta_click"
  | "cities_cta_click"
  | "investor_cta_click"
  | "application_started"
  | "application_submitted"
  | "signup_completed"
  | "login_succeeded"
  | "dashboard_first_view"
  | "invitation_accepted"
  | "role_changed"
  | "case_study_viewed"
  | "insight_viewed";

export function track(event: FunnelEvent, props?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.capture(event, props);
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.identify(userId, traits);
}

export function resetAnalytics() {
  if (!initialized) return;
  posthog.reset();
}

// ----------------------------------------------------------------------------
// Feature flags (PostHog) — for A/B testing without a separate provider.
// Define new flags in PostHog UI; reference them by name here.
// ----------------------------------------------------------------------------

export type FlagName =
  | "hero_copy_v2"
  | "fleet_cta_orange_vs_cyan"
  | "investor_gate_required"
  | "show_live_counter";

export function isFlagEnabled(flag: FlagName): boolean {
  if (!initialized) return false;
  return posthog.isFeatureEnabled(flag) === true;
}

// Returns the named variant for a multi-variate test, or undefined if PH is
// not initialized or the flag isn't multi-variate.
export function getFlagVariant(flag: FlagName): string | undefined {
  if (!initialized) return undefined;
  const v = posthog.getFeatureFlag(flag);
  return typeof v === "string" ? v : undefined;
}

// React hook wrapper. Re-renders when flags load (PostHog fires onFeatureFlags).
import { useEffect, useState } from "react";

export function useFlag(flag: FlagName): boolean {
  const [enabled, setEnabled] = useState<boolean>(() => isFlagEnabled(flag));
  useEffect(() => {
    if (!initialized) return;
    const update = () => setEnabled(isFlagEnabled(flag));
    update();
    posthog.onFeatureFlags(update);
  }, [flag]);
  return enabled;
}

export function useFlagVariant(flag: FlagName): string | undefined {
  const [variant, setVariant] = useState<string | undefined>(() => getFlagVariant(flag));
  useEffect(() => {
    if (!initialized) return;
    const update = () => setVariant(getFlagVariant(flag));
    update();
    posthog.onFeatureFlags(update);
  }, [flag]);
  return variant;
}
