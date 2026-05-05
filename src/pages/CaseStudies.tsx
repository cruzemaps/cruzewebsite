import MarketingLayout from "@/components/marketing/MarketingLayout";
import SEO from "@/components/SEO";
import { Link } from "react-router-dom";
import { CASE_STUDIES } from "@/content/caseStudies";
import { ArrowRight } from "lucide-react";

export default function CaseStudies() {
  return (
    <MarketingLayout>
      <SEO />
      <section className="container mx-auto px-6 py-24 max-w-5xl">
        <h1 className="font-display text-4xl md:text-6xl font-bold mb-4">Case studies.</h1>
        <p className="text-white/60 mb-12 text-lg max-w-2xl">
          What happens when Cruze coordination goes live. Pre/post measurements, control segments, and honest deltas.
        </p>

        <div className="space-y-6">
          {CASE_STUDIES.map((c) => (
            <Link
              key={c.slug}
              to={`/case-studies/${c.slug}`}
              className="block group rounded-2xl border border-white/10 bg-[#0F131C] p-8 hover:border-brand-cyan/40 transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                <span
                  className={`text-xs uppercase tracking-widest font-semibold px-3 py-1 rounded-full border ${
                    c.segment === "city"
                      ? "bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30"
                      : "bg-brand-orange/10 text-brand-orange border-brand-orange/30"
                  }`}
                >
                  {c.segment === "city" ? "City pilot" : "Fleet pilot"}
                </span>
                <time className="text-white/40 text-sm">
                  {new Date(c.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </time>
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-2 group-hover:text-brand-cyan">
                {c.title}
              </h2>
              <p className="text-white/50 text-sm mb-4">{c.customer}</p>
              <p className="text-white/70 mb-6">{c.excerpt}</p>
              <div className="flex flex-wrap gap-6 mb-4">
                {c.metrics.slice(0, 3).map((m) => (
                  <div key={m.label}>
                    <div className="text-brand-cyan font-display font-bold text-2xl">{m.value}</div>
                    <div className="text-white/50 text-xs">{m.label}</div>
                  </div>
                ))}
              </div>
              <div className="inline-flex items-center gap-2 text-brand-cyan text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                Read the full pilot <ArrowRight size={14} />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}
