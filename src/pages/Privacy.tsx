import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import LegalLayout from "@/components/legal/LegalLayout";
import { legalTokens as t } from "@/components/legal/legalTokens";
import {
  CompanyBlock,
  Eyebrow,
  H2,
  H3,
  LEGAL_LAST_UPDATED,
  LI,
  Mail,
  P,
  RelatedLinks,
  Title,
  UL,
  Updated,
} from "@/components/legal/legalUi";

/**
 * Privacy Policy covering BOTH the public website (cruzemaps.com) and the Cruze
 * mobile apps. The website sections are written against the site's actual data
 * flows: the pilot application, the Letter of Intent and its captured metadata,
 * the investor email/dataroom gates and visit logging, the contact form, sign-in,
 * and website analytics. The app sections (precise location, microphone, motion,
 * crash telemetry) are kept because the App Store and Google Play submissions
 * rely on this page. Reachable as real HTML and in the sitemap (prerender.mjs).
 */
export default function Privacy() {
  return (
    <LegalLayout>
      <SEO
        title="Privacy Policy | Cruze"
        description="How Cruze collects, uses, and protects data across the website, the pilot program, and the apps. We do not sell or share your personal information, and we do not use it for advertising tracking."
      />

      <article className="mx-auto max-w-3xl px-5 sm:px-6 py-16 md:py-24">
        <Eyebrow>Legal</Eyebrow>
        <Title>Privacy Policy</Title>
        <Updated date={LEGAL_LAST_UPDATED} />

        <P>
          This Privacy Policy explains what Cruze collects, why, how we use it, and the choices and
          rights you have. It covers the Cruze website at cruzemaps.com, the pilot program and
          dashboards, and the Cruze mobile apps. We have written it in plain language on purpose. If
          anything is unclear, email <Mail addr="info@cruzemaps.com" /> and we will explain it.
        </P>

        <H2 id="notice-at-collection">Notice at collection (summary)</H2>
        <P>
          At or before the point we collect it, here is the short version. We collect the categories of
          personal information described under "What we collect" below, for the purposes described under
          "How we use your data". We keep it for the periods under "Data retention". We do{" "}
          <strong>not</strong> sell or share your personal information (see "Do Not Sell or Share"). For
          details, keep reading; for cookies specifically, see our{" "}
          <Link to="/cookies" className="underline" style={{ color: t.text }}>
            Cookie Notice
          </Link>
          .
        </P>

        <H2>What we collect through the website and pilot</H2>
        <P>
          These are the data flows on cruzemaps.com. We collect only what a feature you are using needs.
        </P>

        <H3>Pilot application</H3>
        <P>
          When you apply for a pilot at <Link to="/apply" className="underline" style={{ color: t.text }}>/apply</Link>,
          we collect your name, company name, work email, phone number, and fleet size, and, where you
          provide them, your company website, truck or vehicle details, primary lanes, your fleet
          management system (FMS) provider, your job title, and any notes you add. We use this to review
          your application, respond, and run the pilot.
        </P>

        <H3>Letter of Intent and signing metadata</H3>
        <P>
          When you e-sign the pilot Letter of Intent (LOI), we record the LOI text, your name, company,
          title, fleet size, email, your initials as your electronic signature, and the version and
          timestamp. To evidence the signature, we also record the IP address and browser user agent at
          the time of signing. See the{" "}
          <Link to="/terms" className="underline" style={{ color: t.text }}>
            Terms of Service
          </Link>{" "}
          for how electronic signing works and your right to a paper copy.
        </P>

        <H3>Investor materials</H3>
        <P>
          On the investor page, if you unlock the full briefing we collect the name, email, and firm you
          enter. To understand interest and follow up, we log investor visits, which can include a
          per-visit session identifier, the page path, the referring URL, your browser user agent, and
          any campaign (UTM) parameters in the link you followed. The dataroom itself is gated and its
          contents are shared separately.
        </P>

        <H3>Contact form</H3>
        <P>
          When you message us through the site, we collect your name, email, optional organization, and
          your message, so we can reply.
        </P>

        <H3>Account and sign-in</H3>
        <P>
          To use the fleet, city, or admin dashboards you sign in. Our authentication provider (Supabase)
          processes your email, name, and the role and status assigned to your account, and stores a
          session token in your browser so you stay signed in.
        </P>

        <H3>Website analytics and cookies</H3>
        <P>
          With your consent, we use privacy-friendly product analytics (PostHog) to understand which
          pages and features are used. This is off until you accept it, and we never use it for
          advertising or cross-site tracking. Our hosting provider (Cloudflare) may also collect
          aggregate, cookieless web analytics at the network edge. The full list of cookies and browser
          storage, and the controls to accept or decline, are in our{" "}
          <Link to="/cookies" className="underline" style={{ color: t.text }}>
            Cookie Notice
          </Link>
          .
        </P>

        <H2>What we collect through the apps</H2>
        <P>
          The Cruze driver and navigation apps collect the categories below. Each is tied to your account
          so we can deliver features specific to you and your trips.
        </P>

        <H3>Precise location</H3>
        <P>
          We collect precise GPS location while you use the app, including in the background during an
          active trip when you enable it. Location powers the live map, turn-by-turn navigation, and
          location-based safety advisories. Without it, the core navigation and safety features cannot
          work.
        </P>

        <H3>Microphone audio</H3>
        <P>
          With your permission, the app processes audio from the device microphone to detect crash
          sounds, such as a collision impact, for safety and forensic purposes. We do not record
          continuous conversations or use microphone audio for advertising.
        </P>

        <H3>Motion and accelerometer</H3>
        <P>
          We read motion and accelerometer sensors to detect hard braking, sudden maneuvers, and
          potential crashes, and to run on-device diagnostics such as tire and engine condition
          estimates.
        </P>

        <H3>Crash and driving telemetry</H3>
        <P>
          We collect driving and crash telemetry, including speed, heading, trip events, hard-braking
          events, and detected crash events, for navigation accuracy, safety advisories, and fleet
          operations reporting.
        </P>

        <H3>App version, diagnostics, and crash logs</H3>
        <P>
          We collect app version, device type, operating system version, and diagnostic and crash logs so
          we can fix bugs and keep the app stable. Crash and error reporting is handled by a third-party
          diagnostics provider (Sentry).
        </P>

        <H2>How we use your data</H2>
        <UL>
          <LI>To review pilot applications, respond, and run pilots, including measuring outcomes against a baseline.</LI>
          <LI>To record and evidence an electronic signature on the LOI.</LI>
          <LI>To provide navigation, live maps, route guidance, and driver safety advisories.</LI>
          <LI>To run on-device vehicle diagnostics such as tire and engine condition estimates.</LI>
          <LI>To support fleet operations and reporting for the organization you drive for.</LI>
          <LI>To respond to your messages, and to follow up with interested investors.</LI>
          <LI>To secure accounts, prevent abuse, and provide customer support.</LI>
          <LI>To understand and improve the site and apps through diagnostics and, with consent, analytics.</LI>
          <LI>To comply with law and enforce our terms.</LI>
        </UL>

        <H2>What we do not do</H2>
        <UL>
          <LI>We do not sell your personal information.</LI>
          <LI>We do not share your personal information for cross-context behavioral advertising.</LI>
          <LI>We do not use your data for cross-app or cross-site advertising tracking.</LI>
          <LI>We do not share your data with data brokers.</LI>
        </UL>

        <H2>Service providers and third parties</H2>
        <P>
          We share data only with processors that help us operate the service, and only as needed for
          their function. They are bound by contract to protect your data and use it only on our
          instructions.
        </P>
        <UL>
          <LI><strong>Supabase</strong>: database, authentication, file storage, and backend functions for the site and pilot.</LI>
          <LI><strong>Cloudflare</strong>: website hosting, content delivery, and edge compute, plus cookieless web analytics.</LI>
          <LI><strong>PostHog</strong>: product analytics, loaded only with your consent.</LI>
          <LI><strong>Resend</strong>: sending transactional email such as application confirmations and invitations.</LI>
          <LI><strong>Google Fonts</strong>: serving site typefaces (your IP is exposed to Google as part of the font request).</LI>
          <LI><strong>Cal.com</strong>: the embedded scheduling widget on the investor page.</LI>
          <LI><strong>Sentry</strong>: diagnostics and crash reporting for the apps.</LI>
          <LI>Maps and navigation providers, to render maps and compute routes in the apps.</LI>
        </UL>
        <P>
          We may also disclose data when required by law, to respond to lawful requests, or to protect the
          safety, rights, or property of drivers, our company, or the public. If we are involved in a
          merger, acquisition, or sale of assets, personal data may transfer as part of that transaction,
          subject to this policy.
        </P>

        <H2 id="do-not-sell">Do Not Sell or Share My Personal Information</H2>
        <P>
          We do not sell your personal information, and we do not share it for cross-context behavioral
          advertising, as those terms are defined under the California Consumer Privacy Act as amended
          (CCPA/CPRA) and similar state laws. Because we do not sell or share, there is no sale or share
          for you to opt out of. If this ever changes, we will update this policy and provide a working
          opt-out before doing so. To ask a question about this, email <Mail addr="info@cruzemaps.com" />.
        </P>

        <H2 id="state-rights">Your US state privacy rights</H2>
        <P>
          Depending on where you live, state privacy laws (including in California, Virginia, Colorado,
          Connecticut, Utah, Texas, and a growing list of other states) give you rights over your personal
          information. Subject to the exceptions in those laws, you may have the right to:
        </P>
        <UL>
          <LI>Know and access the personal information we hold about you, and the categories and purposes involved.</LI>
          <LI>Correct inaccurate personal information.</LI>
          <LI>Delete your personal information.</LI>
          <LI>Obtain a portable copy of information you provided.</LI>
          <LI>Opt out of the sale or sharing of personal information and of targeted advertising (which we do not do).</LI>
          <LI>Limit the use of sensitive personal information (we use it only to provide the service, not to infer characteristics about you).</LI>
          <LI>Not be discriminated against for exercising these rights.</LI>
        </UL>
        <P>
          To exercise a right, email <Mail addr="info@cruzemaps.com" />. We will verify your request
          against the information we hold before acting on it, and you may use an authorized agent where
          the law allows. If we decline, you may appeal by replying to our response, and we will tell you
          the outcome. We do not use personal information to profile you in a way that produces legal or
          similarly significant effects.
        </P>

        <H2>If you are outside the United States</H2>
        <P>
          Cruze is based in the United States and runs its pilots there, and we are built for US
          professional drivers and fleets. If you visit from the EU, the UK, or elsewhere, your
          information will be processed in the United States. Where the GDPR or UK GDPR applies, our legal
          bases are: performing a contract with you or taking pre-contract steps (for example, your pilot
          application); your consent (for example, analytics cookies, which you can withdraw at any time);
          and our legitimate interests in operating, securing, and improving the service. You have rights
          of access, correction, deletion, restriction, objection, and portability, and you may contact a
          data protection authority. We do not have an establishment in the EU or UK and have not
          appointed an Article 27 representative, as we do not target those markets. Email{" "}
          <Mail addr="info@cruzemaps.com" /> to exercise any right.
        </P>

        <H2>Data retention</H2>
        <P>
          We keep personal information for as long as your account or relationship with us is active and
          as needed to provide the service. We keep pilot applications and signed LOIs for as long as
          needed for the pilot and to keep a record of the agreement and the signature. We retain certain
          safety and telemetry records for a limited period to support safety, forensic, and
          fleet-reporting needs, and we keep records longer only where the law requires it. When data is
          no longer needed, we delete it or de-identify it.
        </P>

        <H2>Your choices</H2>
        <H3>Account and app data</H3>
        <P>
          You can delete your account and associated data from inside the app: go to Profile, then Delete
          Account. You can also request deletion by emailing <Mail addr="support@cruzemaps.com" />. We will
          delete your personal data unless we are required to keep specific records by law.
        </P>
        <H3>Cookies and analytics</H3>
        <P>
          Analytics is off until you accept it, and you can change your choice any time in the{" "}
          <Link to="/cookies" className="underline" style={{ color: t.text }}>
            Cookie Notice
          </Link>
          .
        </P>
        <H3>App permissions</H3>
        <P>
          You control location, microphone, and motion permissions in your device settings. Turning off a
          permission may disable the features that depend on it.
        </P>

        <H2>Children</H2>
        <P>
          Cruze is built for professional drivers and businesses and is not directed at children under
          13, and the website is not directed at anyone under 18. We do not knowingly collect personal
          data from children under 13. If you believe a child has provided us data, email{" "}
          <Mail addr="info@cruzemaps.com" /> and we will delete it.
        </P>

        <H2>Security</H2>
        <P>
          We use technical and organizational measures to protect your data, including encryption in
          transit, access controls, and row-level security isolating tenant data. No system is perfectly
          secure, but we work to keep your data safe. To report a security concern, email{" "}
          <Mail addr="info@cruzemaps.com" /> or see our{" "}
          <Link to="/security" className="underline" style={{ color: t.text }}>
            disclosure policy
          </Link>
          .
        </P>

        <H2>Changes to this policy</H2>
        <P>
          We may update this policy as the product and the law change. When we make a material change, we
          will update the date at the top of this page and, where appropriate, notify you. Continued use
          after an update means you accept the revised policy.
        </P>

        <H2>Governing law</H2>
        <P>
          This policy is governed by the laws of the State of Texas and of the United States, without
          regard to conflict-of-law rules, except where a mandatory consumer law provides otherwise.
        </P>

        <CompanyBlock />

        <RelatedLinks
          links={[
            ["Cookie Notice", "/cookies"],
            ["Terms of Service", "/terms"],
            ["Support", "/support"],
            ["Security", "/security"],
          ]}
        />
      </article>
    </LegalLayout>
  );
}
