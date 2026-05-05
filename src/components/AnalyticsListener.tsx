import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageview } from "@/lib/analytics";

// Mounted inside <BrowserRouter>. Fires a $pageview on every route change.
// Init happens once in main.tsx; this just bridges router → analytics.
export function AnalyticsListener() {
  const location = useLocation();
  useEffect(() => {
    trackPageview(location.pathname + location.search);
  }, [location.pathname, location.search]);
  return null;
}
