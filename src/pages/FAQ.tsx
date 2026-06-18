import MarketingLayout from "@/components/marketing/MarketingLayout";
import SEO from "@/components/SEO";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Single-source FAQ — used both for on-page render AND for FAQPage JSON-LD,
// which lights up Google's rich-result feature & gives SGE/AI-overviews
// something concrete to cite.
// Ordered so the high-intent questions people actually search (phantom jams,
// "traffic for no reason," stop-and-go, fleet fuel, city congestion) sit near
// the top. Answers are honest to our pre-seed stage and feed FAQPage rich
// results plus AI overviews.
const FAQS: { q: string; a: string }[] = [
  {
    q: "Why is there traffic when there is no accident?",
    a: "A lot of highway congestion has no crash and no bottleneck. It is a phantom traffic jam: one driver taps the brakes, the car behind brakes a little harder, and that slowdown rolls backward through traffic as a stop-and-go wave. The road can be well under capacity and still grind to a halt. Cruze predicts these waves and guides a small share of drivers to ease off so the wave never builds.",
  },
  {
    q: "What is a phantom traffic jam?",
    a: "A phantom jam is stop-and-go traffic that forms on its own, with no crash, no merge, and no real bottleneck. Physicists showed in 2008 that cars driving in a loop will jam spontaneously, just from small differences in speed and following distance. Phantom jams are a big share of everyday rush-hour congestion, and they are exactly what Cruze is built to dissolve.",
  },
  {
    q: "What causes stop-and-go traffic?",
    a: "Dense traffic plus small changes in speed. When cars are packed closely, one light brake forces the next driver to brake a little harder, and the disturbance amplifies into a wave that travels backward through the cars behind. Higher density makes it worse, which is why stop-and-go happens even when the road is not technically full.",
  },
  {
    q: "Can a navigation app actually reduce traffic instead of just routing around it?",
    a: "Routing apps like Waze and Google Maps move you around congestion, which mostly shifts the jam somewhere else. Cruze is different: it coordinates the speeds of a small share of drivers to smooth the wave at its source, so there is less congestion for everyone on the road, not just a detour for one driver.",
  },
  {
    q: "What does Cruze do?",
    a: "Cruze reads the road from existing traffic cameras and connected vehicles, predicts where a stop-and-go wave is about to form, and gives a few drivers a gentle speed cue (for example, hold 55) so the gap ahead absorbs the wave. Less braking means less fuel, fewer hard stops, and smoother flow, with no new hardware on the road.",
  },
  {
    q: "How is Cruze different from Waze, Google Maps, or Apple Maps?",
    a: "Those tools route individual drivers around existing congestion. Cruze coordinates speeds across nearby vehicles to keep flow stable, so the wave dissolves instead of moving down the road. The result is less braking, less fuel, and fewer rear-end risks for everyone, not a faster detour for one person.",
  },
  {
    q: "How does Cruze help fleets cut fuel costs?",
    a: "Stop-and-go driving is where fuel and brake wear go. By smoothing speed on a corridor, Cruze reduces hard braking and re-acceleration. How much a fleet saves depends on the route and duty cycle, so we measure it against your own telematics during a pilot rather than quote a blanket number.",
  },
  {
    q: "Can cities reduce congestion without building more lanes?",
    a: "Adding lanes often triggers induced demand and fills back up. Cruze raises the effective capacity of a corridor by damping stop-and-go waves, with no construction and no roadside hardware, because it reads existing DOT cameras and guides drivers. Agencies can see measured flow on their own roads before anything reaches a driver.",
  },
  {
    q: "How few drivers does Cruze need to work?",
    a: "Not many. A University of Arizona test-track study found that guiding about one in twenty vehicles was enough to damp stop-and-go waves and cut fuel for every car behind them. Cruze applies the same principle through driver guidance instead of self-driving cars.",
  },
  {
    q: "Do drivers need new hardware?",
    a: "No. Cruze runs on the smartphone the driver already carries. Cities and DOTs need no roadside installation either, since Cruze reads cameras that are already on the road.",
  },
  {
    q: "Does Cruze work with my existing telematics, like Samsara, Geotab, or Motive?",
    a: "Yes. Cruze is designed to run alongside your existing telematics and fleet management system, not replace it. We are pre-pilot, so the specific integration is built out with each fleet during a pilot.",
  },
  {
    q: "What stage is Cruze at?",
    a: "Pre-seed. We have a working vehicle-detection model running on live Texas traffic cameras, a physics-based flow engine in development, and our first pilot corridors lined up in Texas. In 2026, Team Cruze won first place and the $35,000 top prize at UTSA's Draper Data Science Business Plan Competition.",
  },
  {
    q: "How do I start a pilot, and how is Cruze priced?",
    a: "Pick a corridor that hurts and we point Cruze at the cameras already on it. You get a measured baseline within days, we run a guided test with a small group of drivers, then review fuel, hard stops, and throughput against the baseline. No hardware, no long contract. Pricing is per-vehicle for fleets and per-corridor for cities and DOTs, set during a pilot. Email info@cruzemaps.com to start.",
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
          What people ask before they pilot Cruze. Don't see your question? Email <a href="mailto:info@cruzemaps.com" className="text-brand-cyan hover:text-white">info@cruzemaps.com</a>.
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
