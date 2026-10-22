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
  Placeholder,
  RelatedLinks,
  Title,
  UL,
  Updated,
} from "@/components/legal/legalUi";

/**
 * Data Processing Addendum, published as a clearly-marked TEMPLATE for business
 * and fleet customers. It is a starting point for the DPA that would attach to a
 * pilot agreement or MSA, not an executed contract. Counsel finalizes it.
 */
export default function DPA() {
  return (
    <LegalLayout>
      <SEO
        title="Data Processing Addendum (Template) | Cruze"
        description="A template Data Processing Addendum for Cruze business and fleet customers, covering roles, processing scope, subprocessors, security, and data subject requests."
      />

      <article className="mx-auto max-w-3xl px-5 sm:px-6 py-16 md:py-24">
        <Eyebrow>Legal</Eyebrow>
        <Title>Data Processing Addendum</Title>
        <Updated date={LEGAL_LAST_UPDATED} />

        <div
          className="mt-6 rounded-2xl border p-5 text-[14px] leading-relaxed"
          style={{ borderColor: t.accent, background: "rgba(232,89,12,0.08)", color: t.text }}
        >
          <strong>Template.</strong> This is a starting-point Data Processing Addendum ("DPA") for
          business and fleet customers. It is not an executed contract. The operative DPA is the one
          attached to and signed with your pilot agreement or Master Service Agreement. To put a DPA in
          place, email <Mail addr="info@cruzemaps.com" />.
        </div>

        <P>
          This DPA forms part of the agreement between Cruze and the customer ("Customer") for the Cruze
          services (the "Agreement"), and governs how Cruze processes personal data on the Customer's
          behalf. If this DPA conflicts with the Agreement on data protection, this DPA controls.
        </P>

        <H2>1. Roles and scope</H2>
        <P>
          For personal data Cruze processes to provide the services to the Customer (for example, driver
          and fleet-contact details and telematics the Customer provides), the Customer is the controller
          (or business) and Cruze is the processor (or service provider) and will act only on the
          Customer's documented instructions, including those in the Agreement. Where Cruze decides the
          purposes and means of processing, for example its own site analytics, Cruze acts as a
          controller and its{" "}
          <a href="/privacy" className="underline" style={{ color: t.text }}>
            Privacy Policy
          </a>{" "}
          applies.
        </P>

        <H2>2. Subject matter, duration, nature, and purpose</H2>
        <UL>
          <LI><strong>Subject matter and duration:</strong> as set out in the Agreement and for its term plus any wind-down period.</LI>
          <LI><strong>Nature and purpose:</strong> providing the pilot and the Cruze services, including routing advisories and measuring outcomes against a baseline.</LI>
          <LI><strong>Types of personal data:</strong> <Placeholder>list the data types for this customer, e.g. driver name and contact, vehicle and trip telematics, fuel and braking events</Placeholder>.</LI>
          <LI><strong>Categories of data subjects:</strong> <Placeholder>e.g. the Customer's drivers and authorized staff</Placeholder>.</LI>
        </UL>

        <H2>3. Cruze obligations</H2>
        <UL>
          <LI>Process personal data only on the Customer's documented instructions, unless law requires otherwise (and then tell the Customer, unless that is prohibited).</LI>
          <LI>Ensure people authorized to process the data are bound by confidentiality.</LI>
          <LI>Implement appropriate technical and organizational security measures (Section 5).</LI>
          <LI>Assist the Customer, taking into account the nature of processing, with data subject requests, security, breach notice, and any required assessments.</LI>
          <LI>Delete or return personal data at the end of the services, except where law requires retention.</LI>
          <LI>Make available information needed to show compliance, and allow and contribute to audits on reasonable, confidential terms.</LI>
        </UL>

        <H2>4. Subprocessors</H2>
        <P>
          The Customer authorizes Cruze to use subprocessors to provide the services. Cruze remains
          responsible for their performance, imposes data protection terms on them no less protective
          than this DPA, and will keep an up-to-date list available on request and give notice of changes
          with a chance to object. Current infrastructure subprocessors include, at minimum:
        </P>
        <UL>
          <LI><strong>Supabase</strong>: database, authentication, storage, and edge functions.</LI>
          <LI><strong>Cloudflare</strong>: website hosting, content delivery, and edge compute.</LI>
          <LI><strong>Resend</strong>: transactional email delivery.</LI>
          <LI><Placeholder>any other subprocessors for this engagement, e.g. the hosting region and backend provider for the pilot platform</Placeholder>.</LI>
        </UL>

        <H2>5. Security</H2>
        <P>
          Cruze maintains reasonable administrative, technical, and physical safeguards appropriate to
          the risk, including encryption in transit, access controls and least-privilege access,
          row-level security on tenant data, secret management, and logging. A fuller description is in
          our{" "}
          <a href="/security" className="underline" style={{ color: t.text }}>
            security practices
          </a>
          .
        </P>

        <H2>6. Personal data breach</H2>
        <P>
          Cruze will notify the Customer without undue delay after becoming aware of a personal data
          breach affecting the Customer's data, and will provide the information the Customer reasonably
          needs to meet its own notification duties.
        </P>

        <H2>7. International transfers</H2>
        <P>
          Where the services involve transferring personal data across borders, the parties will put in
          place a lawful transfer mechanism, such as the applicable standard contractual clauses, as
          described in <Placeholder>the governing-law and transfer terms for this engagement</Placeholder>.
        </P>

        <H2>8. Data subject requests</H2>
        <P>
          If Cruze receives a request from a data subject relating to the Customer's data, it will, unless
          legally required to respond, refer the request to the Customer and assist the Customer in
          responding.
        </P>

        <H2>9. Governing terms</H2>
        <P>
          This DPA is governed by the law and dispute terms of the Agreement, which name the State of
          Texas, with venue in Bexar County, Texas.
        </P>

        <H3>How to execute a DPA</H3>
        <P>
          Email <Mail addr="info@cruzemaps.com" /> and we will attach the current DPA to your pilot
          agreement or MSA for signature.
        </P>

        <CompanyBlock />

        <RelatedLinks
          links={[
            ["Privacy Policy", "/privacy"],
            ["Security", "/security"],
            ["Terms of Service", "/terms"],
          ]}
        />
      </article>
    </LegalLayout>
  );
}
