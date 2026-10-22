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
 * Disclosures page: the forward-looking-statements and no-investment-advice
 * notice (referenced from /investors and the dataroom), the performance /
 * no-guarantee disclaimer for any routing or savings figures, and the advisory
 * safety note. One place the other pages can link to.
 */
export default function Disclosures() {
  return (
    <LegalLayout>
      <SEO
        title="Disclosures | Cruze"
        description="Important disclosures: forward-looking statements, no investment advice, no guarantee of traffic or savings results, and the driver-safety note that routing is advisory."
      />

      <article className="mx-auto max-w-3xl px-5 sm:px-6 py-16 md:py-24">
        <Eyebrow>Legal</Eyebrow>
        <Title>Disclosures</Title>
        <Updated date={LEGAL_LAST_UPDATED} />

        <P>
          These disclosures apply to the whole site, and especially to the investor materials, the pilot
          pages, and anywhere we describe potential results.
        </P>

        <H2 id="forward-looking">Forward-looking statements</H2>
        <P>
          Parts of this site describe our plans, roadmap, pilots, projections, and expectations. These
          are forward-looking statements, not statements of fact. They involve risks and uncertainties,
          and actual results can differ materially. Cruze is an early-stage company that is pre-revenue
          and still raising. We are under no obligation to update forward-looking statements as things
          change, except where the law requires it.
        </P>

        <H2 id="no-investment-advice">No investment advice or offer</H2>
        <P>
          Nothing on this site, including the investor page and the dataroom, is an offer to sell or a
          solicitation to buy any security, and nothing here is investment, legal, tax, or financial
          advice. Any materials shared for diligence are confidential, are provided for information only,
          and do not constitute a recommendation. Any securities offering would be made only to eligible
          investors through definitive offering documents and the required agreements. Make your own
          assessment and consult your own advisers.
        </P>

        <H2 id="no-guarantee">No guarantee of results</H2>
        <P>
          Figures on this site about congestion, fuel, emissions, time, braking, or savings are
          estimates, model outputs, cited third-party research, or results measured under specific
          conditions. They are illustrative and are not a promise or guarantee of the results you will
          get. Traffic, routing, and fleet outcomes depend on many factors outside our control, including
          road conditions, driver behavior, weather, and your own baseline. Pilots measure outcomes
          against a control group for exactly this reason. Past or pilot results do not guarantee future
          results.
        </P>

        <H2 id="advisory-safety">Routing is advisory; the driver is responsible</H2>
        <P>
          Cruze provides routing, speed guidance, and advisories that are informational only and may be
          delayed, incomplete, or inaccurate. The driver is solely responsible for operating the vehicle
          safely and lawfully at all times, and must obey all traffic laws, posted limits, signals, road
          conditions, and the instructions of law enforcement. Never follow an advisory that would require
          unsafe or unlawful driving, and do not let the product distract you from the road.
        </P>

        <H2>Third-party research and citations</H2>
        <P>
          Where we cite outside research or public data, we attribute the source. Those sources are the
          work of their authors; citing them does not mean they endorse Cruze.
        </P>

        <H2>Questions</H2>
        <P>
          Email <Mail addr="investors@cruzemaps.com" /> about the investor materials, or{" "}
          <Mail addr="info@cruzemaps.com" /> for anything else.
        </P>

        <CompanyBlock />

        <RelatedLinks
          links={[
            ["Investors", "/investors"],
            ["Terms of Service", "/terms"],
            ["Privacy Policy", "/privacy"],
          ]}
        />
      </article>
    </LegalLayout>
  );
}
