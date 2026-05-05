import MarketingLayout from "@/components/marketing/MarketingLayout";
import SEO from "@/components/SEO";
import { Link } from "react-router-dom";
import { INSIGHTS } from "@/content/insights";
import { ArrowRight } from "lucide-react";

export default function Insights() {
  return (
    <MarketingLayout>
      <SEO />
      <section className="container mx-auto px-6 py-24 max-w-4xl">
        <h1 className="font-display text-4xl md:text-6xl font-bold mb-4">Insights.</h1>
        <p className="text-white/60 mb-12 text-lg max-w-2xl">
          Long-form research and operating playbooks on traffic dissolution, swarm coordination, and the economics of moving vehicles.
        </p>

        <div className="space-y-6">
          {INSIGHTS.map((post) => (
            <Link
              key={post.slug}
              to={`/insights/${post.slug}`}
              className="block group rounded-2xl border border-white/10 bg-[#0F131C] p-8 hover:border-brand-cyan/40 transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 mb-3 text-sm text-white/40">
                <span>{post.author}</span>
                <time>
                  {new Date(post.publishedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-3 group-hover:text-brand-cyan">{post.title}</h2>
              <p className="text-white/70 mb-4">{post.excerpt}</p>
              <div className="flex flex-wrap items-center gap-3">
                {post.tags.map((t) => (
                  <span key={t} className="text-xs text-white/50 bg-white/5 px-2 py-1 rounded-full">{t}</span>
                ))}
                <span className="ml-auto inline-flex items-center gap-2 text-brand-cyan text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Read <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}
