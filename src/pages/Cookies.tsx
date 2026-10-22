import { useEffect, useState } from "react";
import SEO from "@/components/SEO";
import LegalLayout from "@/components/legal/LegalLayout";
import { legalTokens as t } from "@/components/legal/legalTokens";
import {
  CompanyBlock,
  Eyebrow,
  H2,
  LEGAL_LAST_UPDATED,
  LI,
  Mail,
  P,
  RelatedLinks,
  Title,
  UL,
  Updated,
} from "@/components/legal/legalUi";
import { getConsent, onConsentChange, type ConsentValue } from "@/lib/consent";
import { applyConsentChoice } from "@/lib/consentAnalytics";

/**
 * Cookie Notice for the public site. It lists the real browser storage the site
 * uses and the real third parties it talks to (inventoried from the code, not a
 * generic template), and carries the ongoing manage-preferences control that
 * pairs with the first-visit ConsentBanner.
 */

// Small interactive control so a visitor can change the analytics choice at any
// time, not just when the banner first appears.
function CookiePreferences() {
  const [choice, setChoice] = useState<ConsentValue | null>(null);

  useEffect(() => {
    setChoice(getConsent());
    return onConsentChange((v) => setChoice(v));
  }, []);

  const set = (value: ConsentValue) => applyConsentChoice(value);

  const status =
    choice === "accepted"
      ? "Analytics cookies are ON for this browser."
      : choice === "declined"
        ? "Analytics cookies are OFF for this browser."
        : "You have not chosen yet, so analytics cookies are OFF.";

  return (
    <div className="mt-6 rounded-2xl border p-6" style={{ borderColor: t.line, background: t.bg2 }}>
      <div className="text-xs uppercase tracking-[0.18em] mb-2" style={{ color: t.accent }}>
        Your choice
      </div>
      <p className="text-[15px]" style={{ color: t.muted }}>
        {status} Essential cookies cannot be turned off because the site needs them to work.
      </p>
      <div className="mt-5 flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={() => set("accepted")}
          aria-pressed={choice === "accepted"}
          className="px-4 py-2 rounded-full text-[14px] font-medium transition-opacity hover:opacity-90"
          style={{ background: t.accent, color: "#fff" }}
        >
          Accept analytics cookies
        </button>
        <button
          type="button"
          onClick={() => set("declined")}
          aria-pressed={choice === "declined"}
          className="px-4 py-2 rounded-full text-[14px] font-medium border transition-colors"
          style={{ borderColor: t.line, color: t.text, background: "transparent" }}
        >
          Decline analytics cookies
        </button>
      </div>
    </div>
  );
}

export default function Cookies() {
  return (
    <LegalLayout>
      <SEO
        title="Cookie Notice | Cruze"
        description="The cookies and browser storage the Cruze website uses, the third parties involved, and how to accept or decline non-essential analytics cookies."
      />

      <article className="mx-auto max-w-3xl px-5 sm:px-6 py-16 md:py-24">
        <Eyebrow>Legal</Eyebrow>
        <Title>Cookie Notice</Title>
        <Updated date={LEGAL_LAST_UPDATED} />

        <P>
          This notice explains the cookies and similar browser storage that the Cruze website
          (cruzemaps.com) uses, and the third parties involved. It covers the public website only.
          The Cruze mobile apps describe their own data handling in the{" "}
          <a href="/privacy" className="underline" style={{ color: t.text }}>
            Privacy Policy
          </a>
          .
        </P>

        <P>
          We keep this short and specific. We do not use advertising cookies, and we do not use cookies
          to track you across other sites or apps. The only non-essential technology we load is
          privacy-friendly product analytics, and it does not run until you accept it below.
        </P>

        <H2 id="manage">Manage your preferences</H2>
        <P>
          Analytics is off by default. When you first visit we show a short banner; if you take no
          action, or decline, no analytics loads. You can change your choice here at any time.
        </P>
        <CookiePreferences />

        <H2>Essential storage (always on)</H2>
        <P>
          These are set because a feature you are using needs them. They are first-party, they are not
          used for tracking or advertising, and the site cannot function properly without them.
        </P>
        <UL>
          <LI>
            <strong>Sign-in session</strong> (Supabase auth token in local storage, keys beginning
            <code> sb-</code>): keeps you logged in to the fleet, city, or admin dashboards.
          </LI>
          <LI>
            <strong>Application draft</strong> (session storage): holds your in-progress pilot
            application on <a href="/apply" className="underline" style={{ color: t.text }}>/apply</a> so a
            sign-in step does not lose your answers. Cleared when you submit.
          </LI>
          <LI>
            <strong>Investor visit and gate state</strong> (session storage, plus a local-storage flag
            that marks you as the site owner to exclude your own visits): remembers that you passed the
            email or dataroom gate during a visit so you are not re-prompted on each page.
          </LI>
          <LI>
            <strong>Fleet dashboard token</strong> (session storage): the short-lived backend session
            that powers the fleet driver scores page.
          </LI>
        </UL>

        <H2>Analytics (only after you accept)</H2>
        <P>
          If you accept, we load <strong>PostHog</strong> product analytics (posthog.com) to understand
          which pages and features are used, so we can improve them. PostHog sets its own cookies and
          local storage in your browser and may record page views, clicks, and the pages you visit,
          tied to an anonymous identifier. We do not use it for advertising and we do not sell this
          data. If you decline, PostHog is never loaded and sets nothing.
        </P>
        <P>
          Separately, our content delivery provider, <strong>Cloudflare</strong>, may collect aggregate,
          privacy-first web analytics at the network edge. This measurement is designed to be cookieless:
          it does not set cookies or use any identifier to track you across sites. Because it sets no
          cookies, it is not gated by the choice above.
        </P>

        <H2>Other third parties the site loads</H2>
        <P>
          Some pages load resources from the services below. These are needed for the feature on that
          page rather than for tracking.
        </P>
        <UL>
          <LI>
            <strong>Supabase</strong> (database, sign-in, and the forms on the site): stores the data you
            submit. See the Privacy Policy.
          </LI>
          <LI>
            <strong>Google Fonts</strong> (fonts.googleapis.com, fonts.gstatic.com): serves the site
            typefaces. Loading a font exposes your IP address to Google as part of the request.
          </LI>
          <LI>
            <strong>Cal.com</strong>: only on the investor page, and only once you reach the "book a
            call" step, an embedded scheduler loads from cal.com and may set its own cookies.
          </LI>
          <LI>
            <strong>jsDelivr CDN</strong> and public transportation-data hosts: used only on the live
            traffic-camera views, which are off by default, to load a video player and public camera
            data.
          </LI>
        </UL>

        <H2>Do Not Track and global signals</H2>
        <P>
          Because analytics is off until you opt in, a browser "Do Not Track" or opt-out preference
          signal already matches our default: with no acceptance, nothing non-essential runs.
        </P>

        <H2>Questions</H2>
        <P>
          Email <Mail addr="info@cruzemaps.com" /> with any question about this notice or the storage
          the site uses.
        </P>

        <CompanyBlock />

        <RelatedLinks
          links={[
            ["Privacy Policy", "/privacy"],
            ["Terms of Service", "/terms"],
            ["Support", "/support"],
          ]}
        />
      </article>
    </LegalLayout>
  );
}
