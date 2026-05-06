import { useEffect } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import MarketingLayout from "@/components/marketing/MarketingLayout";
import SEO from "@/components/SEO";
import { ArrowLeft } from "lucide-react";
import { findCaseStudy, type CaseStudy } from "@/content/caseStudies";
import { SITE } from "@/lib/seo";
import { track } from "@/lib/analytics";

export default function CaseStudyDetail() {
  const { slug } = useParams<{ slug: string }>();
  const study = slug ? findCaseStudy(slug) : undefined;

  useEffect(() => {
    if (study) track("case_study_viewed", { slug: study.slug, segment: study.segment });
  }, [study]);

  if (!study) return <Navigate to="/case-studies" replace />;

  return (
    <MarketingLayout>
      <SEO
        title={`${study.title} | Cruze Case Study`}
        description={study.excerpt}
        jsonLd={articleJsonLd(study)}
        canonicalOverride={`${SITE.url}/case-studies/${study.slug}`}
      />

      <article className="container mx-auto px-6 py-16 max-w-3xl">
        <Link to="/case-studies" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-8">
          <ArrowLeft size={14} /> All case studies
        </Link>

        <header className="mb-12">
          <span
            className={`text-xs uppercase tracking-widest font-semibold px-3 py-1 rounded-full border ${
              study.segment === "city"
                ? "bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30"
                : "bg-brand-orange/10 text-brand-orange border-brand-orange/30"
            }`}
          >
            {study.segment === "city" ? "City pilot" : "Fleet pilot"}
          </span>
          <h1 className="font-display text-3xl md:text-5xl font-bold mt-4 mb-3">{study.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-white/50 text-sm">
            <span>{study.customer}</span>
            <span>·</span>
            <time>{new Date(study.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</time>
          </div>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12 p-6 rounded-2xl bg-[#0F131C] border border-white/10">
          {study.metrics.map((m) => (
            <div key={m.label}>
              <div className="font-display text-2xl md:text-3xl font-bold text-brand-cyan">{m.value}</div>
              <div className="text-white/50 text-xs">{m.label}</div>
            </div>
          ))}
        </div>

        <div className="prose prose-invert max-w-none">
          {study.body.split("\n\n").map((para, i) => (
            <p key={i} className="text-white/80 leading-relaxed mb-6">{para}</p>
          ))}
        </div>
      </article>
    </MarketingLayout>
  );
}

function articleJsonLd(study: CaseStudy) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: study.title,
    description: study.excerpt,
    author: { "@type": "Organization", name: "Cruzemaps" },
    publisher: { "@type": "Organization", name: "Cruze", logo: { "@type": "ImageObject", url: `${SITE.url}/logo.png` } },
    datePublished: study.publishedAt,
    mainEntityOfPage: `${SITE.url}/case-studies/${study.slug}`,
  };
}
