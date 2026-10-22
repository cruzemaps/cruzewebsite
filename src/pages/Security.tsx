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
 * Responsible Disclosure / security page. Pairs with the machine-readable
 * /.well-known/security.txt (RFC 9116). Tells researchers how to report, what is
 * in and out of scope, and what to expect, plus a short summary of our security
 * practices for customers.
 */
export default function Security() {
  return (
    <LegalLayout>
      <SEO
        title="Security & Responsible Disclosure | Cruze"
        description="How to report a security vulnerability to Cruze, our responsible-disclosure safe harbor, scope, and a summary of our security practices."
      />

      <article className="mx-auto max-w-3xl px-5 sm:px-6 py-16 md:py-24">
        <Eyebrow>Security</Eyebrow>
        <Title>Security and Responsible Disclosure</Title>
        <Updated date={LEGAL_LAST_UPDATED} />

        <P>
          We take the security of Cruze and of the data people trust us with seriously. If you believe
          you have found a vulnerability, we want to hear from you and we will work with you to confirm
          and fix it.
        </P>

        <H2>Report a vulnerability</H2>
        <P>
          Email <Mail addr="info@cruzemaps.com" />. Please include enough detail to reproduce the
          issue: the affected URL or endpoint, the steps, and the impact you believe it has. If you need
          to send sensitive details, say so and we will arrange a secure channel. A machine-readable
          version of this contact is published at{" "}
          <a href="/.well-known/security.txt" className="underline" style={{ color: t.text }}>
            /.well-known/security.txt
          </a>
          .
        </P>

        <H2>Our commitment to you (safe harbor)</H2>
        <P>
          If you make a good-faith effort to follow this policy, we will not pursue or support legal
          action against you for your research, and we will treat your report as authorized access for
          the testing described below. We will acknowledge your report, keep you updated, and credit you
          if you would like once the issue is resolved.
        </P>

        <H2>Please do</H2>
        <UL>
          <LI>Give us a reasonable time to investigate and fix an issue before disclosing it publicly.</LI>
          <LI>Use only test or your own accounts, and only interact with data that belongs to you.</LI>
          <LI>Stop and report once you have confirmed a vulnerability, rather than exploring further.</LI>
          <LI>Avoid privacy violations, data destruction, and any interruption or degradation of our services.</LI>
        </UL>

        <H2>Please do not</H2>
        <UL>
          <LI>Run denial-of-service, spam, social-engineering, or physical-security attacks.</LI>
          <LI>Access, modify, or delete other people's data, or exfiltrate data beyond the minimum needed to prove an issue.</LI>
          <LI>Use automated scanning that degrades the service.</LI>
          <LI>Publicly disclose a vulnerability before we have had a chance to address it.</LI>
        </UL>

        <H2>Scope</H2>
        <P>
          In scope: cruzemaps.com and its subdomains that we operate. Out of scope: third-party services
          we use but do not control (for example Supabase, Cloudflare, and Cal.com), which have their own
          disclosure programs; findings that require a compromised device or physical access; and
          best-practice suggestions with no demonstrable security impact. If you are unsure, ask us first.
        </P>

        <H2>How we protect data</H2>
        <P>
          A short summary for customers and partners. More detail for a specific engagement is in our{" "}
          <a href="/dpa" className="underline" style={{ color: t.text }}>
            Data Processing Addendum
          </a>
          .
        </P>
        <UL>
          <LI>Encryption of data in transit, and a strict content security policy delivered with the site.</LI>
          <LI>Access controls and least-privilege access, with row-level security isolating tenant data in the database.</LI>
          <LI>Secrets kept out of source control and scanned for on every change.</LI>
          <LI>Security-relevant response headers, and dependency and build checks in our pipeline.</LI>
        </UL>

        <H2>No bounty (for now)</H2>
        <P>
          We do not currently run a paid bug-bounty program. We are grateful for reports and will credit
          researchers who want it. This is not a commitment to pay a reward.
        </P>

        <CompanyBlock />

        <RelatedLinks
          links={[
            ["Acceptable Use", "/acceptable-use"],
            ["Privacy Policy", "/privacy"],
            ["Data Processing Addendum", "/dpa"],
          ]}
        />
      </article>
    </LegalLayout>
  );
}
