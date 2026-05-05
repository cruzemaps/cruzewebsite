import MarketingLayout from "@/components/marketing/MarketingLayout";
import SEO from "@/components/SEO";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Single-source FAQ — used both for on-page render AND for FAQPage JSON-LD,
// which lights up Google's rich-result feature & gives SGE/AI-overviews
// something concrete to cite.
const FAQS: { q: string; a: string }[] = [
  {
    q: "What does Cruze actually do?",
    a: "Cruze is a navigation layer that coordinates driver speeds across many vehicles to dissolve phantom traffic jams. These are the stop-and-go waves caused by minor braking events. Other apps route around traffic. Cruze prevents the wave from forming in the first place.",
  },
  {
    q: "How is Cruze different from Waze, Google Maps, or Apple Maps?",
    a: "Those tools route individual drivers around existing congestion. Cruze actively coordinates speeds across the swarm of nearby vehicles using physics-informed AI to keep flow stable. The result: less braking, less fuel, fewer accidents, and lower travel time for everyone using the road.",
  },
  {
    q: "How is Cruze different from Geotab, Samsara, or Motive?",
    a: "Telematics platforms surface what your fleet did. Cruze changes what your fleet does in real time. We integrate with Samsara, Geotab, Motive, Verizon Connect, Trimble, and Omnitracs in under a day. Cruze runs alongside, not instead of, your FMS.",
  },
  {
    q: "Do drivers need new hardware?",
    a: "No. Cruze runs on the smartphone the driver already carries, or as a Cruze-aware tab inside your existing FMS app. Cities and DOTs require no roadside installation either.",
  },
  {
    q: "How quickly can a fleet get measurable savings?",
    a: "Most pilots benchmark within 30 days against the prior 90 days of telematics. Calibrated savings reports are delivered every Monday once enough trips have accumulated.",
  },
  {
    q: "Is my data shared with other fleets?",
    a: "No. Aggregated, anonymized flow signals contribute to swarm coordination, but per-vehicle telemetry is never shared with other operators. Pilot data residency is configurable.",
  },
  {
    q: "What does the swarm need to work?",
    a: "Coordination scales with density. Cruze coordinates effectively at as little as 1.5% of vehicles on a corridor. This is not because we need many users, but because phantom jam suppression has a steep marginal effect.",
  },
  {
    q: "How is Cruze priced?",
    a: "Per-vehicle subscription for fleets, with pilot-period discounts. Cities and DOTs license per-corridor with optional network-wide bundles. Pricing on request.",
  },
  {
    q: "Does Cruze work outside the US?",
    a: "Today's deployments are US-based. International expansion is on the roadmap; reach out if you operate cross-border lanes you'd like included in the next wave.",
  },
];

export default function FAQ() {
  return (
    <MarketingLayout>
      <SEO
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map(({ q, a }) => ({
            "@type": "Question",
            name: q,
            acceptedAnswer: { "@type": "Answer", text: a },
          })),
        }}
      />

      <section className="container mx-auto px-6 py-24 max-w-3xl">
        <h1 className="font-display text-4xl md:text-6xl font-bold mb-4">Frequently asked.</h1>
        <p className="text-white/60 mb-12 text-lg">
          What people ask before they pilot Cruze. Don't see your question? Email <a href="mailto:hello@cruzemaps.com" className="text-brand-cyan hover:text-white">hello@cruzemaps.com</a>.
        </p>

        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((item, i) => (
            <AccordionItem key={item.q} value={`item-${i}`} className="border-white/10">
              <AccordionTrigger className="text-left font-display font-semibold text-lg hover:text-brand-cyan">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-white/70 leading-relaxed">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </MarketingLayout>
  );
}
