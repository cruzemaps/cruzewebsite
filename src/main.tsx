import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { initAnalytics } from "./lib/analytics";
import { hasAnalyticsConsent } from "./lib/consent";

// Non-essential analytics (PostHog) loads only after the visitor has accepted
// in the cookie banner. With no choice, or a decline, it never initialises and
// sets no cookies. ConsentBanner calls initAnalytics() the moment they accept.
if (hasAnalyticsConsent()) initAnalytics();

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
