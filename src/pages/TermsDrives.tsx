import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import LegalLayout, { legalTokens as t } from "@/components/legal/LegalLayout";

/**
 * Terms of Service for the Cruze DRIVE-LOGGING app (com.cruzemaps.drives).
 * Two clauses carry the weight: (1) safe-driving responsibility — the app is
 * a hands-off recorder, never a reason to touch the phone or drive fast; and
 * (2) the user-generated-content rules App Review requires for a social app
 * (App Store guideline 1.2): acceptable use, reporting, blocking, and our
 * moderation commitment. Registered in src/lib/seo.ts for prerendering.
 */

const LAST_UPDATED = "2026-08-20";

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

function UL({ children }: { children: React.ReactNode }) {
  return <ul className="mt-4 space-y-2.5 text-[15px] md:text-base leading-relaxed list-none">{children}</ul>;
}

function LI({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3" style={{ color: t.muted }}>
      <span className="mt-2.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: t.accent }} />
      <span>{children}</span>
    </li>
  );
}

const mail = (addr: string) => (
  <a href={`mailto:${addr}`} className="underline transition-colors hover:text-white" style={{ color: t.text }}>{addr}</a>
);

export default function TermsDrives() {
  return (
    <LegalLayout>
      <SEO
        title="Terms of Service — Cruze Drive Logging | Cruze"
        description="The terms for the Cruze drive-logging app: record your drives hands-off, drive legally and attentively at all times, and follow the community rules for shared drives, reporting, and blocking."
      />

      <article className="mx-auto max-w-3xl px-5 sm:px-6 py-16 md:py-24">
        <p className="text-xs uppercase tracking-[0.18em] mb-5" style={{ color: t.accent, fontFamily: t.body }}>Legal</p>
        <h1 className="font-bold tracking-[-0.025em] leading-[1.05]" style={{ fontFamily: t.display, color: t.text, fontSize: "clamp(2.2rem, 5vw, 3.4rem)" }}>
          Terms of Service — Cruze drive logging
        </h1>
        <p className="mt-5 text-[15px]" style={{ color: t.muted }}>Last updated: {LAST_UPDATED}</p>

        <P>
          These terms govern your use of the Cruze drive-logging app. By creating an account or using the app you
          agree to them. (The legacy Cruze Maps navigation app has its own terms{" "}
          <Link to="/terms" className="underline" style={{ color: t.text }}>here</Link>.) You must be at least 13 years
          old to use Cruze.
        </P>

        <H2>Drive safely — this is the deal</H2>
        <P>
          Cruze is a hands-off recorder. You press Start Drive, put the phone away, and drive. It is not a navigation
          product and it never asks for your attention while you are moving.
        </P>
        <UL>
          <LI>
            You are solely responsible for operating your vehicle safely and obeying every traffic law, everywhere,
            at all times.
          </LI>
          <LI>Never interact with the app while driving. Mount the phone or pocket it; the recording takes care of itself.</LI>
          <LI>
            Cruze contains no speed competitions, time trials, or leaderboards, and recording a drive is never a reason
            to drive faster. The only score in the app rewards smooth, attentive driving.
          </LI>
          <LI>Public roads are not a racetrack. Content that celebrates street racing or reckless driving is prohibited (below).</LI>
        </UL>

        <H2>Your content and the community</H2>
        <P>
          Drives, titles, photos, garage entries, and profile details you share are your content. You own it; you give
          us the license needed to store it and display it to the audience you choose (followers, public, or private).
          Routes shown to anyone else are automatically trimmed near your start and end points.
        </P>
        <P>Do not post content that:</P>
        <UL>
          <LI>documents or glorifies street racing, speed runs, or reckless or unlawful driving;</LI>
          <LI>harasses, threatens, or targets another person, or reveals someone else's private information;</LI>
          <LI>is sexually explicit, hateful, or illegal;</LI>
          <LI>infringes someone else's rights or impersonates another person;</LI>
          <LI>is spam or a scam.</LI>
        </UL>
        <P>
          Every shared drive has a Report action and every profile can be blocked. We review reports within 24 hours
          and remove violating content; repeated or serious violations end the account. To report anything outside the
          app, email {mail("support@cruzemaps.com")}.
        </P>

        <H2>Your account</H2>
        <P>
          Keep your credentials secure — you are responsible for activity on your account. You can delete your account
          at any time in the app (Profile → Delete account); deletion permanently removes your uploaded data. We may
          suspend or terminate accounts that violate these terms.
        </P>

        <H2>The service</H2>
        <P>
          The app is provided "as is" and "as available." GPS and sensor readings are estimates: distances, elevation,
          speeds, and scores can be inaccurate, and recordings can be interrupted by your device or operating system.
          Do not rely on Cruze as evidence of anything or as a safety system. We may change, suspend, or discontinue
          features at any time.
        </P>

        <H2>Limitation of liability</H2>
        <P>
          To the maximum extent permitted by law, Cruze and its makers are not liable for indirect, incidental,
          special, consequential, or punitive damages, or for any loss arising from your driving, from other users'
          content or conduct, or from inaccurate recordings. Nothing in these terms limits liability that cannot be
          limited by law.
        </P>

        <H2>Changes to these terms</H2>
        <P>
          We may update these terms as the product and the law change. Material changes will be reflected in the date
          above and, where appropriate, flagged in the app. Continued use after an update means you accept the revised
          terms.
        </P>

        <H2>Governing law</H2>
        <P>
          These terms are governed by the laws of the United States and the state in which Cruze is established,
          without regard to conflict-of-law rules.
        </P>

        <H2>Contact</H2>
        <P>Questions about these terms: {mail("support@cruzemaps.com")}.</P>

        <div className="mt-12 pt-8 border-t flex flex-wrap gap-x-6 gap-y-2 text-[15px]" style={{ borderColor: t.line }}>
          <Link to="/privacy-drives" className="font-medium hover:text-white transition-colors" style={{ color: t.accent }}>Privacy Policy</Link>
          <Link to="/support" className="font-medium hover:text-white transition-colors" style={{ color: t.accent }}>Support</Link>
        </div>
      </article>
    </LegalLayout>
  );
}
