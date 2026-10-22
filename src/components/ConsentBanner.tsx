import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getConsent, type ConsentValue } from "@/lib/consent";
import { applyConsentChoice } from "@/lib/consentAnalytics";
import { legalTokens as t } from "@/components/legal/legalTokens";

/**
 * Cookie-consent banner for the public site. It shows only until the visitor
 * makes a choice, and the privacy-preserving default is enforced upstream:
 * analytics (PostHog) is not initialised at all until someone accepts here
 * (see src/main.tsx and src/lib/consentAnalytics.ts). Declining, or ignoring
 * the banner, loads no non-essential cookies. The two actions carry equal
 * visual weight on purpose.
 */
export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only surface when no choice has been recorded yet.
    setVisible(getConsent() === null);
  }, []);

  if (!visible) return null;

  const choose = (value: ConsentValue) => {
    applyConsentChoice(value);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie choices"
      className="fixed bottom-0 left-0 right-0 z-[60] border-t backdrop-blur"
      style={{ background: "rgba(11,13,17,0.94)", borderColor: t.line, fontFamily: t.body }}
    >
      <div className="mx-auto max-w-5xl px-5 sm:px-6 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-[13px] leading-relaxed" style={{ color: t.muted }}>
          We use essential cookies to run this site and, only if you accept, privacy-friendly analytics
          to understand what people read. We do not use advertising or cross-site tracking cookies.{" "}
          <Link to="/cookies" className="underline" style={{ color: t.text }}>
            Cookie Notice
          </Link>
          .
        </p>
        <div className="flex flex-shrink-0 gap-2.5">
          <button
            type="button"
            onClick={() => choose("declined")}
            className="px-4 py-2 rounded-full text-[14px] font-medium border transition-colors"
            style={{ borderColor: t.line, color: t.text, background: "transparent" }}
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => choose("accepted")}
            className="px-4 py-2 rounded-full text-[14px] font-medium transition-opacity hover:opacity-90"
            style={{ background: t.accent, color: "#fff" }}
          >
            Accept analytics
          </button>
        </div>
      </div>
    </div>
  );
}
