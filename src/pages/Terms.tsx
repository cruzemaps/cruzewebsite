import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import LegalLayout, { legalTokens as t } from "@/components/legal/LegalLayout";

/**
 * Terms of Service for the Cruze driver-advisory navigation app. The critical
 * clause is the advisory-not-liability section: Cruze gives guidance, but the
 * driver is solely responsible for operating the vehicle and obeying the law at
 * all times. Required, alongside Privacy and Support, for App Store and Google
 * Play submission. Registered in scripts/prerender.mjs so it ships as real HTML.
 */

const LAST_UPDATED = "2026-06-24";

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-bold tracking-[-0.02em] mt-12 mb-4" style={{ fontFamily: t.display, color: t.text, fontSize: "clamp(1.4rem, 2.6vw, 1.9rem)" }}>
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 text-[15px] md:text-base leading-relaxed" style={{ color: t.muted }}>{children}</p>;
}

const mail = (addr: string) => (
  <a href={`mailto:${addr}`} className="underline transition-colors hover:text-white" style={{ color: t.text }}>{addr}</a>
);

export default function Terms() {
  return (
    <LegalLayout>
      <SEO
        title="Terms of Service | Cruze"
        description="The terms that govern your use of the Cruze driver app. Cruze provides driver advisories; the driver is solely responsible for operating the vehicle and obeying all traffic laws at all times."
      />

      <article className="mx-auto max-w-3xl px-5 sm:px-6 py-16 md:py-24">
        <p className="text-xs uppercase tracking-[0.18em] mb-5" style={{ color: t.accent, fontFamily: t.body }}>Legal</p>
        <h1 className="font-bold tracking-[-0.025em] leading-[1.05]" style={{ fontFamily: t.display, color: t.text, fontSize: "clamp(2.2rem, 5vw, 3.4rem)" }}>
          Terms of Service
        </h1>
        <p className="mt-5 text-[15px]" style={{ color: t.muted }}>Last updated: {LAST_UPDATED}</p>

        <P>
          These Terms of Service ("Terms") govern your access to and use of the Cruze app and related services
          ("Cruze"). Cruze is operated by Cruzemaps. By creating an account or using the app, you agree to these Terms. If
          you do not agree, do not use Cruze.
        </P>

        <H2>1. Acceptance</H2>
        <P>
          By downloading, accessing, or using Cruze, you accept these Terms and our{" "}
          <Link to="/privacy" className="underline" style={{ color: t.text }}>Privacy Policy</Link>. If you use Cruze on
          behalf of a fleet or other organization, you confirm that you have authority to accept these Terms for that
          organization, and "you" includes that organization.
        </P>

        <H2>2. License to use Cruze</H2>
        <P>
          We grant you a limited, non-exclusive, non-transferable, revocable license to use Cruze for its intended purpose:
          navigation, live maps, and driver safety advisories. You may not copy, modify, reverse engineer, resell, or
          attempt to extract the underlying source or data of the app, except where the law expressly allows it. We may
          update, change, or discontinue features at any time.
        </P>

        <H2>3. Driver advisories and your responsibility</H2>
        <P>
          Cruze provides driver advisories. The driver is solely responsible for vehicle operation at all times and must
          obey all traffic laws and posted limits. Cruze guidance, including routes, speed suggestions, safety alerts, and
          diagnostic estimates, is informational only and may be delayed, incomplete, or inaccurate.
        </P>
        <P>
          You must keep your full attention on the road and your surroundings. Do not interact with the app in a way that
          distracts you from driving. Never follow an advisory that would require you to break the law, drive unsafely, or
          ignore road conditions, signs, signals, or the instructions of law enforcement. Crash and hazard detection are
          best-effort features and are not a substitute for safe driving or emergency services.
        </P>

        <H2>4. Account terms</H2>
        <P>
          You are responsible for keeping your account credentials secure and for all activity under your account. Provide
          accurate information, keep it current, and notify us promptly of any unauthorized use. You must be old enough to
          form a binding contract in your jurisdiction to use Cruze, and Cruze is not directed at children under 13.
        </P>

        <H2>5. Acceptable use</H2>
        <P>
          You agree not to misuse Cruze. This includes not using it for any unlawful purpose, not interfering with or
          disrupting the service or its infrastructure, not attempting to gain unauthorized access to any system or data,
          and not using the app in any way that endangers yourself or others.
        </P>

        <H2>6. No warranty</H2>
        <P>
          Cruze is provided on an "as is" and "as available" basis, without warranties of any kind, whether express or
          implied, including any implied warranties of merchantability, fitness for a particular purpose, accuracy, or
          non-infringement. We do not warrant that the app will be uninterrupted, error free, or that any advisory,
          route, or estimate is accurate or reliable.
        </P>

        <H2>7. Limitation of liability</H2>
        <P>
          To the fullest extent permitted by law, Cruzemaps and its officers, employees, and suppliers will not be liable
          for any indirect, incidental, special, consequential, or punitive damages, or for any loss of profits, data,
          goodwill, or for any damages arising from your use of, or inability to use, Cruze, including any reliance on a
          driver advisory. To the extent liability cannot be excluded, our total liability for any claim relating to Cruze
          is limited to the amount you paid us, if any, for the service in the 12 months before the claim.
        </P>

        <H2>8. Termination</H2>
        <P>
          You may stop using Cruze and delete your account at any time from Profile, then Delete Account, or by emailing{" "}
          {mail("support@cruzemaps.com")}. We may suspend or terminate your access if you violate these Terms, if required
          by law, or if we discontinue the service. Sections that by their nature should survive termination, such as
          limitation of liability and governing law, will survive.
        </P>

        <H2>9. Changes to these Terms</H2>
        <P>
          We may update these Terms as the product and the law change. When we make a material change, we will update the
          date at the top of this page and, where appropriate, notify you in the app. Continued use of Cruze after an
          update means you accept the revised Terms.
        </P>

        <H2>10. Governing law</H2>
        <P>
          These Terms are governed by the laws of the United States and the state in which Cruzemaps is established,
          without regard to conflict-of-law rules. Any dispute relating to these Terms will be resolved in the courts
          located in that state, unless applicable law requires otherwise.
        </P>

        <H2>11. Contact us</H2>
        <P>
          Questions about these Terms: {mail("support@cruzemaps.com")}. Privacy questions: {mail("privacy@cruzemaps.com")}.
        </P>

        <div className="mt-12 pt-8 border-t flex flex-wrap gap-x-6 gap-y-2 text-[15px]" style={{ borderColor: t.line }}>
          <Link to="/privacy" className="font-medium hover:text-white transition-colors" style={{ color: t.accent }}>Privacy Policy</Link>
          <Link to="/support" className="font-medium hover:text-white transition-colors" style={{ color: t.accent }}>Support</Link>
        </div>
      </article>
    </LegalLayout>
  );
}
