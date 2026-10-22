import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import LegalLayout from "@/components/legal/LegalLayout";
import { legalTokens as t } from "@/components/legal/legalTokens";
import {
  CompanyBlock,
  Eyebrow,
  H2,
  LEGAL_LAST_UPDATED,
  Mail,
  P,
  RelatedLinks,
  Title,
  Updated,
} from "@/components/legal/legalUi";

/**
 * Terms of Service for the Cruze website, the pilot program and dashboards, and
 * the driver-advisory apps. Load-bearing clauses: the advisory-not-liability
 * section (the driver is responsible for safe, legal operation), the electronic
 * signature / LOI section (ESIGN and UETA), the warranty disclaimer, and the
 * limitation of liability. Required alongside Privacy and Support for the App
 * Store and Google Play. Registered in scripts/prerender.mjs so it ships as HTML.
 */
export default function Terms() {
  return (
    <LegalLayout>
      <SEO
        title="Terms of Service | Cruze"
        description="The terms that govern your use of the Cruze website, pilot program, and apps. Cruze provides advisories; the driver is solely responsible for operating the vehicle and obeying all traffic laws at all times."
      />

      <article className="mx-auto max-w-3xl px-5 sm:px-6 py-16 md:py-24">
        <Eyebrow>Legal</Eyebrow>
        <Title>Terms of Service</Title>
        <Updated date={LEGAL_LAST_UPDATED} />

        <P>
          These Terms of Service ("Terms") govern your access to and use of the Cruze website at
          cruzemaps.com, the pilot program and dashboards, the Cruze apps, and related services
          (together, "Cruze"). Cruze is operated by Cruzemaps. By using Cruze, you agree to these Terms.
          If you do not agree, do not use Cruze.
        </P>

        <H2>1. Acceptance and who may use Cruze</H2>
        <P>
          By accessing or using Cruze, you accept these Terms, our{" "}
          <Link to="/privacy" className="underline" style={{ color: t.text }}>Privacy Policy</Link>, and our{" "}
          <Link to="/acceptable-use" className="underline" style={{ color: t.text }}>Acceptable Use Policy</Link>,
          which is part of these Terms. If you use Cruze on behalf of a fleet or other organization, you
          confirm you have authority to accept these Terms for that organization, and "you" includes that
          organization. You must be old enough to form a binding contract in your jurisdiction, and the
          website is not directed at anyone under 18.
        </P>

        <H2>2. The services</H2>
        <P>
          Cruze provides traffic and routing intelligence, driver advisories, a website with information
          and application tools, a pilot program, dashboards for fleets and cities, and investor
          materials. We grant you a limited, non-exclusive, non-transferable, revocable license to use
          Cruze for its intended purpose. You may not copy, modify, reverse engineer, resell, or extract
          the underlying source, models, or data, except where the law expressly allows. We may update,
          change, or discontinue features at any time.
        </P>

        <H2>3. Intellectual property and ownership</H2>
        <P>
          Cruze and its licensors own all right, title, and interest in the Services, including the
          software, models, algorithms, data, text, design, and the "Cruze" and "Cruzemaps" names and
          logos. These Terms grant you a license to use the Services, not any ownership. All rights not
          expressly granted are reserved, and you may not use our trademarks without our prior written
          permission.
        </P>
        <P>
          You keep ownership of the content and data you submit, such as your application details and any
          fleet data you provide. You grant us a worldwide, non-exclusive license to host, process, and
          use that content to provide and improve the Services, as described in our{" "}
          <Link to="/privacy" className="underline" style={{ color: t.text }}>Privacy Policy</Link> and any
          pilot agreement. If you send us feedback or suggestions, you grant us a perpetual, royalty-free
          license to use them without obligation to you.
        </P>

        <H2>4. Driver advisories and your responsibility</H2>
        <P>
          Cruze provides driver advisories. The driver is solely responsible for vehicle operation at all
          times and must obey all traffic laws and posted limits. Cruze guidance, including routes, speed
          suggestions, safety alerts, and diagnostic estimates, is informational only and may be delayed,
          incomplete, or inaccurate.
        </P>
        <P>
          Keep your full attention on the road and your surroundings. Never follow an advisory that would
          require you to break the law, drive unsafely, or ignore road conditions, signs, signals, or law
          enforcement. Crash and hazard detection are best-effort features and are not a substitute for
          safe driving or emergency services.
        </P>

        <H2>5. Accounts</H2>
        <P>
          You are responsible for keeping your credentials secure and for all activity under your
          account. Provide accurate information, keep it current, and tell us promptly of any unauthorized
          use.
        </P>

        <H2>6. The pilot program and the Letter of Intent</H2>
        <P>
          If you apply for and join a pilot, the specific terms of that pilot are set out in the Letter of
          Intent (LOI) you sign and in any separate pilot agreement. The LOI governs the pilot itself,
          including scope, the savings-verification baseline, any performance fee, data access, and
          confidentiality, and it controls over these Terms where they conflict on those subjects. The LOI
          states that it is non-binding and that either party may end the pilot on the notice it sets out.
        </P>

        <H2>7. Electronic signatures and records</H2>
        <P>
          Cruze lets you agree to the LOI and other documents electronically. By checking the agreement
          box and submitting, you consent to do business electronically and to use electronic records and
          signatures for that transaction, and you intend your action, including your typed initials and
          the recorded timestamp, to be your signature and to have the same effect as a handwritten one
          under the US ESIGN Act and the Uniform Electronic Transactions Act (UETA).
        </P>
        <P>
          You can keep a copy: a signed LOI is available from your dashboard, and we record the signing
          details, including a timestamp and signing metadata, with each record. You have the right to
          request a paper copy of a document you signed, and to withdraw your consent to transact
          electronically, by emailing <Mail addr="support@cruzemaps.com" />; withdrawing consent does not
          affect the validity of records created before you withdrew it. To sign electronically you need a
          current browser and an email account that can receive our messages.
        </P>

        <H2>8. Acceptable use</H2>
        <P>
          Your use of Cruze must follow our{" "}
          <Link to="/acceptable-use" className="underline" style={{ color: t.text }}>Acceptable Use Policy</Link>.
          In short: do not use Cruze unlawfully, do not interfere with or disrupt it or its
          infrastructure, do not attempt unauthorized access to any system or data, and do not use it in a
          way that endangers anyone.
        </P>

        <H2>9. Investor materials and disclosures</H2>
        <P>
          Investor materials on this site are for information only. They are not an offer to sell or a
          solicitation to buy any security, and they are not investment advice. They include
          forward-looking statements and estimates that are not guarantees. Please read our{" "}
          <Link to="/disclosures" className="underline" style={{ color: t.text }}>Disclosures</Link>, which
          are part of these Terms.
        </P>

        <H2>10. No warranty</H2>
        <P>
          Cruze is provided on an "as is" and "as available" basis, without warranties of any kind,
          express or implied, including implied warranties of merchantability, fitness for a particular
          purpose, accuracy, or non-infringement. We do not warrant that Cruze will be uninterrupted or
          error free, or that any advisory, route, estimate, or savings figure is accurate, reliable, or
          achievable. Any traffic, routing, fuel, or savings figures are estimates and are not a promise
          of results.
        </P>

        <H2>11. Limitation of liability</H2>
        <P>
          To the fullest extent permitted by law, Cruzemaps and its officers, employees, and suppliers
          will not be liable for any indirect, incidental, special, consequential, or punitive damages, or
          for any loss of profits, data, or goodwill, or for any damages arising from your use of, or
          inability to use, Cruze, including any reliance on an advisory. To the extent liability cannot
          be excluded, our total liability for any claim relating to Cruze is limited to the amount you
          paid us, if any, for the service in the 12 months before the claim.
        </P>

        <H2>12. Indemnification</H2>
        <P>
          To the fullest extent permitted by law, you will defend, indemnify, and hold harmless Cruze
          Maps, Inc. and its officers, employees, and suppliers from any claims, damages, liabilities, and
          costs, including reasonable legal fees, arising out of your use of the Services, the content or
          data you submit, or your violation of these Terms, the Acceptable Use Policy, or the law. We may
          take over the defense of any matter subject to indemnification, and you will cooperate with us.
        </P>

        <H2>13. Copyright and DMCA</H2>
        <P>
          We respect intellectual property rights. If you believe content on the Services infringes your
          copyright, send a notice to <Mail addr="info@cruzemaps.com" /> that includes: your contact
          details; identification of the copyrighted work; identification of the material you say
          infringes and where it is on the Services; a statement that you have a good-faith belief the use
          is not authorized; a statement, under penalty of perjury, that your notice is accurate and you
          are authorized to act for the owner; and your physical or electronic signature. We respond to
          valid notices under the Digital Millennium Copyright Act (DMCA), which may include removing
          material, forwarding counter-notices, and terminating repeat infringers.
        </P>

        <H2>14. Termination</H2>
        <P>
          You may stop using Cruze and delete your account at any time from Profile, then Delete Account,
          or by emailing <Mail addr="support@cruzemaps.com" />. We may suspend or terminate your access if
          you violate these Terms, if required by law, or if we discontinue the service. Sections that by
          their nature should survive termination, such as limitation of liability and governing law, will
          survive.
        </P>

        <H2>15. Changes to these Terms</H2>
        <P>
          We may update these Terms as the product and the law change. When we make a material change, we
          will update the date at the top of this page and, where appropriate, notify you. Continued use
          after an update means you accept the revised Terms.
        </P>

        <H2>16. Governing law and disputes</H2>
        <P>
          These Terms are governed by the laws of the State of Texas and of the United States, without
          regard to conflict-of-law rules. Any dispute relating to these Terms will be resolved in the
          state or federal courts located in Bexar County, Texas, unless applicable law requires
          otherwise. (Cruze Maps, Inc. is incorporated in Delaware; its principal place of business is in
          San Antonio, Texas.)
        </P>

        <H2>17. Contact</H2>
        <P>
          Questions about these Terms, or privacy questions: <Mail addr="info@cruzemaps.com" />.
        </P>

        <CompanyBlock />

        <RelatedLinks
          links={[
            ["Privacy Policy", "/privacy"],
            ["Acceptable Use", "/acceptable-use"],
            ["Disclosures", "/disclosures"],
            ["Support", "/support"],
          ]}
        />
      </article>
    </LegalLayout>
  );
}
