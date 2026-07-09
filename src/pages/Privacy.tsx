import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import LegalLayout, { legalTokens as t } from "@/components/legal/LegalLayout";

/**
 * Privacy Policy for the Cruze driver/navigation app. Written to match Cruze's
 * actual data practices (precise location, microphone for crash-sound
 * detection, motion/accelerometer for diagnostics and crash detection, account
 * email/name, and diagnostics/crash logs). This is a hard requirement for App
 * Store and Google Play submission, so it must be reachable as real HTML and
 * appear in the sitemap (registered in scripts/prerender.mjs).
 */

const LAST_UPDATED = "2026-06-24";

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

export default function Privacy() {
  return (
    <LegalLayout>
      <SEO
        title="Privacy Policy | Cruze"
        description="How Cruze collects, uses, and protects driver data, including location, microphone, motion, and account information. Cruze does not sell your data or use it for advertising tracking."
      />

      <article className="mx-auto max-w-3xl px-5 sm:px-6 py-16 md:py-24">
        <p className="text-xs uppercase tracking-[0.18em] mb-5" style={{ color: t.accent, fontFamily: t.body }}>Legal</p>
        <h1 className="font-bold tracking-[-0.025em] leading-[1.05]" style={{ fontFamily: t.display, color: t.text, fontSize: "clamp(2.2rem, 5vw, 3.4rem)" }}>
          Privacy Policy
        </h1>
        <p className="mt-5 text-[15px]" style={{ color: t.muted }}>Last updated: {LAST_UPDATED}</p>

        <P>
          Cruze builds a driving and navigation app for truck fleets. It provides live maps, navigation, and driver
          safety advisories. This policy explains what data we collect, why we collect it, how we use it, and the
          choices and rights you have. It applies to the Cruze mobile app and the services that support it.
        </P>
        <P>
          We have written this in plain language on purpose. If anything here is unclear, email us at {mail("privacy@cruzemaps.com")} and
          we will explain it.
        </P>

        <H2>Data we collect</H2>
        <P>
          We collect only what the app needs to navigate, keep drivers safe, and run fleet operations. The categories below
          describe what we collect and the specific reason for each.
        </P>

        <H3>Precise location</H3>
        <P>
          We collect precise GPS location while you use the app, including in the background during an active trip when you
          enable it. Location powers the live map, turn-by-turn navigation, and safety advisories that depend on where you
          are on the road. Without location, the core navigation and safety features cannot work.
        </P>

        <H3>Microphone audio</H3>
        <P>
          With your permission, the app processes audio from the device microphone to detect crash sounds, such as a
          collision impact, for safety and forensic purposes. The app listens for these events during a trip. We do not
          record continuous conversations or use microphone audio for advertising. Audio is processed to identify safety
          events tied to your trip and account.
        </P>

        <H3>Motion and accelerometer</H3>
        <P>
          We read motion and accelerometer sensors to detect hard braking, sudden maneuvers, and potential crashes, and to
          run on-device diagnostics such as tire and engine condition estimates. This data supports driver safety
          advisories and vehicle health features.
        </P>

        <H3>Crash and driving telemetry</H3>
        <P>
          We collect driving and crash telemetry, including speed, heading, trip events, hard-braking events, and detected
          crash events. This is used for navigation accuracy, safety advisories, and fleet operations reporting.
        </P>

        <H3>Account information</H3>
        <P>
          When you create an account, we collect your name and email address so we can identify you, secure your account,
          and provide support. Fleet administrators may also associate your account with their organization.
        </P>

        <H3>App version, diagnostics, and crash logs</H3>
        <P>
          We collect app version, device type, operating system version, and diagnostic and crash logs so we can fix bugs
          and keep the app stable. Crash and error reporting is handled by a third-party diagnostics provider (Sentry).
        </P>

        <H2>How we use your data</H2>
        <UL>
          <LI>To provide navigation, live maps, and route guidance.</LI>
          <LI>To deliver driver safety advisories, including crash and hard-braking detection.</LI>
          <LI>To run on-device vehicle diagnostics such as tire and engine condition estimates.</LI>
          <LI>To support fleet operations and reporting for the organization you drive for.</LI>
          <LI>To secure accounts, prevent abuse, and provide customer support.</LI>
          <LI>To diagnose, fix, and improve the app through diagnostics and crash logs.</LI>
        </UL>

        <H2>What we do not do</H2>
        <UL>
          <LI>We do not sell your personal data.</LI>
          <LI>We do not use your data for cross-app or cross-site advertising tracking.</LI>
          <LI>We do not share your data with data brokers.</LI>
        </UL>

        <H2>How your data is linked to you</H2>
        <P>
          The data described above is linked to your identity. It is tied to your driver account so we can deliver
          navigation, safety advisories, and fleet features that are specific to you and your trips.
        </P>

        <H2>Service providers we use</H2>
        <P>
          We share data only with third-party processors that help us operate the service, and only as needed for them to
          perform their function. These providers are bound by contract to protect your data and use it only on our
          instructions. They fall into the following categories:
        </P>
        <UL>
          <LI>Maps and navigation providers, to render maps and compute routes.</LI>
          <LI>Cloud hosting and backend infrastructure, including our database and authentication provider (Supabase).</LI>
          <LI>Diagnostics and crash reporting (Sentry).</LI>
        </UL>
        <P>
          We may also disclose data when required by law, to respond to lawful requests, or to protect the safety, rights,
          or property of drivers, our company, or the public.
        </P>

        <H2>Data retention</H2>
        <P>
          We keep your data for as long as your account is active and as needed to provide the service. We retain certain
          safety and telemetry records for a limited period to support safety, forensic, and fleet-reporting needs, and we
          keep records longer only where the law requires it. When data is no longer needed, we delete it or de-identify
          it.
        </P>

        <H2>Your rights and choices</H2>
        <H3>Delete your account and data</H3>
        <P>
          You can delete your account and associated data from inside the app at any time: go to Profile, then Delete
          Account. You can also request deletion by emailing {mail("support@cruzemaps.com")}. We will delete your personal
          data unless we are required to keep specific records by law.
        </P>
        <H3>Access and correction</H3>
        <P>
          You can request a copy of the personal data we hold about you, and you can ask us to correct information that is
          inaccurate. Email {mail("privacy@cruzemaps.com")} to make a request.
        </P>
        <H3>Permissions</H3>
        <P>
          You control location, microphone, and motion permissions through your device settings. Turning off a permission
          may disable the features that depend on it, such as navigation or crash detection.
        </P>

        <H2>Children</H2>
        <P>
          Cruze is built for professional drivers and is not directed at children under 13. We do not knowingly collect
          personal data from children under 13. If you believe a child has provided us data, email {mail("privacy@cruzemaps.com")} and
          we will delete it.
        </P>

        <H2>Security</H2>
        <P>
          We use technical and organizational measures to protect your data, including encryption in transit and access
          controls on our systems. No system is perfectly secure, but we work to keep your data safe. To report a security
          concern, email {mail("security@cruzemaps.com")}.
        </P>

        <H2>Changes to this policy</H2>
        <P>
          We may update this policy as the product and the law change. When we make a material change, we will update the
          date at the top of this page and, where appropriate, notify you in the app. Continued use of Cruze after an
          update means you accept the revised policy.
        </P>

        <H2>Governing law</H2>
        <P>
          This policy is governed by the laws of the United States and the state in which Cruze is established, without
          regard to conflict-of-law rules.
        </P>

        <H2>Contact us</H2>
        <P>
          Privacy questions: {mail("privacy@cruzemaps.com")}. Security reports: {mail("security@cruzemaps.com")}. General
          help: {mail("support@cruzemaps.com")}.
        </P>

        <div className="mt-12 pt-8 border-t flex flex-wrap gap-x-6 gap-y-2 text-[15px]" style={{ borderColor: t.line }}>
          <Link to="/support" className="font-medium hover:text-white transition-colors" style={{ color: t.accent }}>Support</Link>
          <Link to="/terms" className="font-medium hover:text-white transition-colors" style={{ color: t.accent }}>Terms of Service</Link>
        </div>
      </article>
    </LegalLayout>
  );
}
