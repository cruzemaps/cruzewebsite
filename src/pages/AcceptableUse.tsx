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

/**
 * Acceptable Use Policy for the website, the pilot, and the dashboards. Covers
 * the standard prohibited-conduct set a B2B SaaS AUP carries, plus the one point
 * specific to Cruze: the routing and advisories are informational and the driver
 * stays responsible for safe, legal operation.
 */
export default function AcceptableUse() {
  return (
    <LegalLayout>
      <SEO
        title="Acceptable Use Policy | Cruze"
        description="The rules for using the Cruze website, pilot program, and dashboards: prohibited conduct, security and integrity rules, and the driver-safety expectation."
      />

      <article className="mx-auto max-w-3xl px-5 sm:px-6 py-16 md:py-24">
        <Eyebrow>Legal</Eyebrow>
        <Title>Acceptable Use Policy</Title>
        <Updated date={LEGAL_LAST_UPDATED} />

        <P>
          This Acceptable Use Policy ("AUP") applies to everyone who uses the Cruze website, the pilot
          program, the dashboards, and any related service (together, the "Services"). It is part of, and
          incorporated into, our{" "}
          <a href="/terms" className="underline" style={{ color: t.text }}>
            Terms of Service
          </a>
          . If you use the Services on behalf of a company, you are responsible for your users following
          this AUP.
        </P>

        <H2>You may not</H2>
        <UL>
          <LI>Use the Services for anything unlawful, fraudulent, or deceptive, or to infringe someone else's rights.</LI>
          <LI>Access, probe, or scan the Services or their infrastructure without authorization, or try to defeat authentication, rate limits, or access controls.</LI>
          <LI>Interfere with or disrupt the Services, for example through denial-of-service attempts, injecting malware, or overloading our systems.</LI>
          <LI>Scrape, crawl, harvest, or bulk-download content or data except as a public robots policy and these terms allow.</LI>
          <LI>Reverse engineer, decompile, or try to extract source code, models, or underlying data, except where the law expressly permits it.</LI>
          <LI>Upload or submit content that is unlawful, defamatory, harassing, or that you do not have the right to share.</LI>
          <LI>Submit false information, impersonate another person or company, or sign an agreement you are not authorized to sign.</LI>
          <LI>Misuse forms or messaging to send spam, chain messages, or unsolicited commercial content.</LI>
          <LI>Resell, sublicense, or provide the Services to third parties except as your agreement with us allows.</LI>
          <LI>Attempt to re-identify data that has been aggregated or de-identified.</LI>
        </UL>

        <H2>Security research</H2>
        <P>
          Good-faith security research is welcome under our{" "}
          <a href="/security" className="underline" style={{ color: t.text }}>
            Responsible Disclosure policy
          </a>
          . Follow that policy rather than this AUP's access restrictions when you are testing in good
          faith and reporting what you find.
        </P>

        <H2>Safe and legal operation (drivers and fleets)</H2>
        <P>
          Cruze routing, speed guidance, and advisories are informational. They may be delayed,
          incomplete, or inaccurate. The driver is always responsible for operating the vehicle safely
          and for obeying all traffic laws, posted limits, signals, road conditions, and the instructions
          of law enforcement. Do not follow any advisory that would require you to drive unsafely or
          break the law, and do not interact with the product in a way that distracts you from driving.
          Fleets must not direct drivers to use the product in a way that conflicts with this rule.
        </P>

        <H2>Enforcement</H2>
        <P>
          We may investigate suspected violations and may suspend or terminate access, remove content, or
          take other appropriate action, including reporting unlawful activity to authorities. We will use
          reasonable judgment and, where practical, give notice.
        </P>

        <H2>Report a violation</H2>
        <P>
          To report abuse or a violation of this policy, email <Mail addr="support@cruzemaps.com" />. For
          security vulnerabilities, use <Mail addr="info@cruzemaps.com" /> and our{" "}
          <a href="/security" className="underline" style={{ color: t.text }}>
            disclosure policy
          </a>
          .
        </P>

        <CompanyBlock />

        <RelatedLinks
          links={[
            ["Terms of Service", "/terms"],
            ["Privacy Policy", "/privacy"],
            ["Responsible Disclosure", "/security"],
          ]}
        />
      </article>
    </LegalLayout>
  );
}
