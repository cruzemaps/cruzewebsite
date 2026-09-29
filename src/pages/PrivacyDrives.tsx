import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import LegalLayout, { legalTokens as t } from "@/components/legal/LegalLayout";

/**
 * Privacy Policy for the Cruze DRIVE-LOGGING app (bundle id
 * com.cruzemaps.drives — the "Strava for drives" pivot). Distinct from
 * /privacy, which covers the legacy Cruze Maps navigation app: this app has
 * NO microphone capability, uploads nothing until the user signs in, and adds
 * a social layer (profiles, follows, drive sharing). Written to match the
 * app's actual behavior — keep in lockstep with the app repo's
 * docs/STORE_PRIVACY_VALUES.md. Required for App Store submission; must be
 * registered in src/lib/seo.ts so it prerenders as real HTML.
 */

const LAST_UPDATED = "2026-08-20";

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-bold tracking-[-0.02em] mt-12 mb-4" style={{ fontFamily: t.display, color: t.text, fontSize: "clamp(1.4rem, 2.6vw, 1.9rem)" }}>
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-semibold mt-7 mb-2.5" style={{ fontFamily: t.display, color: t.text, fontSize: "1.1rem" }}>
      {children}
    </h3>
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

export default function PrivacyDrives() {
  return (
    <LegalLayout>
      <SEO
        title="Privacy Policy — Cruze Drive Logging | Cruze"
        description="How the Cruze drive-logging app handles your data: location only while you record a drive, motion processed on-device, no microphone, no ads, no data sales. Routes are privacy-trimmed before anyone else can see them."
      />

      <article className="mx-auto max-w-3xl px-5 sm:px-6 py-16 md:py-24">
        <p className="text-xs uppercase tracking-[0.18em] mb-5" style={{ color: t.accent, fontFamily: t.body }}>Legal</p>
        <h1 className="font-bold tracking-[-0.025em] leading-[1.05]" style={{ fontFamily: t.display, color: t.text, fontSize: "clamp(2.2rem, 5vw, 3.4rem)" }}>
          Privacy Policy — Cruze drive logging
        </h1>
        <p className="mt-5 text-[15px]" style={{ color: t.muted }}>Last updated: {LAST_UPDATED}</p>

        <P>
          This policy covers the Cruze drive-logging app — the app you use to record your drives, keep a log of the
          roads you love, and share drives with people you choose. (The legacy Cruze Maps navigation app has its own
          policy <Link to="/privacy" className="underline" style={{ color: t.text }}>here</Link>.)
        </P>
        <P>
          The short version: your drives live on your phone first. Nothing leaves your device until you create an
          account and sign in. We never sell your data, never show ads, and never use tracking. If anything here is
          unclear, email {mail("privacy@cruzemaps.com")} and we will explain it.
        </P>

        <H2>Data we collect</H2>

        <H3>Precise location — only while you record</H3>
        <P>
          When you press Start Drive, the app records your GPS route — including in the background with your screen
          locked — until you end the drive. The system location indicator is visible the entire time. We do not collect
          location at any other moment. In guest mode, routes are stored only on your device; with an account, finished
          drives upload so you can back them up and share them.
        </P>

        <H3>Motion sensors — processed on your device</H3>
        <P>
          During a recording, the app reads the accelerometer to compute your smoothness score (gentle braking, easy
          throttle, steady cornering). Raw sensor data never leaves your phone — only summary statistics, such as event
          counts, are stored with the drive.
        </P>

        <H3>No microphone</H3>
        <P>This app has no microphone capability of any kind and never processes audio.</P>

        <H3>Account and profile</H3>
        <P>
          If you create an account we collect your email address, a display name, and a username, so we can identify
          you, secure the account, and show your profile to other drivers. Signing in with Apple shares only what you
          approve in Apple's dialog.
        </P>

        <H3>Photos you choose to add</H3>
        <P>
          Photos reach us only when you attach them yourself — a profile picture or pictures of your cars. We never
          scan your photo library.
        </P>

        <H3>Diagnostics</H3>
        <P>
          We collect app version and, when crash reporting is enabled in a release, crash logs (via Sentry) so we can
          fix bugs. Crash data is not linked to your identity.
        </P>

        <H2>Who can see your drives</H2>
        <UL>
          <LI>
            <strong style={{ color: t.text }}>Privacy trim, always:</strong> the route shape anyone else can ever see is
            automatically trimmed around your start and end points, so where you park stays private. The full route is
            visible only to you.
          </LI>
          <LI>Each drive has a visibility setting — followers (default), public, or private.</LI>
          <LI>Blocking someone hides you from each other everywhere, including search.</LI>
        </UL>

        <H2>What we do not do</H2>
        <UL>
          <LI>We do not sell or license your personal data or your driving telemetry — to anyone, including insurers.</LI>
          <LI>We do not use advertising or cross-app tracking, and we show no ads.</LI>
          <LI>We do not rank or score how fast anyone drives. There are no speed leaderboards, by design.</LI>
        </UL>

        <H2>Service providers</H2>
        <P>
          We use Supabase for hosting, database, and authentication, and Sentry for crash reporting when enabled. Map
          imagery is loaded from a basemap tile provider; tile requests include your viewport but are not tied to your
          account. Providers act only on our instructions. We may also disclose data when required by law or to protect
          the safety and rights of our users or the public.
        </P>

        <H2>Your rights and choices</H2>
        <H3>Delete your account and data</H3>
        <P>
          In the app: Profile → Delete account. This permanently removes your account and everything uploaded to it —
          drives, profile, photos, follows. Drives saved on your device stay on your device. You can also email
          {" "}{mail("support@cruzemaps.com")}.
        </P>
        <H3>Access and correction</H3>
        <P>
          Request a copy of your data or a correction at {mail("privacy@cruzemaps.com")}.
        </P>
        <H3>Permissions</H3>
        <P>
          Location and motion permissions are controlled in your device settings; turning them off disables drive
          recording but the rest of the app keeps working.
        </P>

        <H2>Children</H2>
        <P>
          Cruze is not directed at children under 13, and you must be at least 13 to create an account. If you believe
          a child has provided us data, email {mail("privacy@cruzemaps.com")} and we will delete it.
        </P>

        <H2>Security</H2>
        <P>
          Data is encrypted in transit; server access is controlled with row-level security so your private routes are
          readable only by your account. Report security concerns to {mail("security@cruzemaps.com")}.
        </P>

        <H2>Changes</H2>
        <P>
          When we make a material change we will update the date above and, where appropriate, notify you in the app.
        </P>

        <H2>Contact us</H2>
        <P>
          Privacy: {mail("privacy@cruzemaps.com")} · Security: {mail("security@cruzemaps.com")} · Help:
          {" "}{mail("support@cruzemaps.com")}
        </P>

        <div className="mt-12 pt-8 border-t flex flex-wrap gap-x-6 gap-y-2 text-[15px]" style={{ borderColor: t.line }}>
          <Link to="/terms-drives" className="font-medium hover:text-white transition-colors" style={{ color: t.accent }}>Terms of Service</Link>
          <Link to="/support" className="font-medium hover:text-white transition-colors" style={{ color: t.accent }}>Support</Link>
        </div>
      </article>
    </LegalLayout>
  );
}
