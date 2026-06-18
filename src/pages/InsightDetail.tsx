import { useEffect } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import MarketingLayout from "@/components/marketing/MarketingLayout";
import ArticleBody from "@/components/marketing/ArticleBody";
import SEO from "@/components/SEO";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { findInsight, INSIGHTS, type Insight } from "@/content/insights";
import { SITE } from "@/lib/seo";
import { track } from "@/lib/analytics";

export default function InsightDetail() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? findInsight(slug) : undefined;

  useEffect(() => {
    if (post) track("insight_viewed", { slug: post.slug });
  }, [post]);

  if (!post) return <Navigate to="/insights" replace />;

  // Related articles: other insights that share a tag (cluster internal linking).
  const related = INSIGHTS.filter((i) => i.slug !== post.slug && i.tags.some((t) => post.tags.includes(t))).slice(0, 3);

  return (
    <MarketingLayout>
      <SEO
        title={`${post.title} | Cruze Insights`}
        description={post.excerpt}
        jsonLd={articleJsonLd(post)}
        canonicalOverride={`${SITE.url}/insights/${post.slug}`}
      />

      <article className="container mx-auto px-6 py-16 max-w-3xl">
        <Link to="/insights" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-8">
          <ArrowLeft size={14} /> All insights
        </Link>

        <header className="mb-12">
          <h1 className="font-display text-3xl md:text-5xl font-bold mb-4">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-white/50 text-sm">
            <span className="text-white/70">{post.author}</span>
            {post.authorTitle && <><span>·</span><span>{post.authorTitle}</span></>}
            <span>·</span>
            <time>{new Date(post.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</time>
          </div>
        </header>

        <ArticleBody body={post.body} />

        {/* Conversion CTA — every article routes back to the product */}
        <div className="mt-14 rounded-2xl border border-brand-orange/30 bg-brand-orange/5 p-7">
          <div className="font-display text-xl md:text-2xl font-bold text-white mb-2">See Cruze dissolve a traffic wave</div>
          <p className="text-white/70 mb-5">
            Watch a phantom jam form and clear on the homepage, then talk to us about a pilot on your roads.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full font-medium text-[15px] bg-brand-orange text-[#0B0E14] hover:opacity-90 transition-opacity">
              See it in action <ArrowRight size={15} />
            </Link>
            <Link to="/for-fleets" className="px-5 py-2.5 rounded-full font-medium text-[15px] border border-white/20 text-white hover:border-white transition-colors">For fleets</Link>
            <Link to="/for-cities" className="px-5 py-2.5 rounded-full font-medium text-[15px] border border-white/20 text-white hover:border-white transition-colors">For cities &amp; DOTs</Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-white/10">
          {post.tags.map((t) => (
            <span key={t} className="text-xs text-white/50 bg-white/5 px-3 py-1 rounded-full">{t}</span>
          ))}
        </div>

        {related.length > 0 && (
          <div className="mt-12 pt-8 border-t border-white/10">
            <div className="text-xs uppercase tracking-widest text-white/40 mb-4">Keep reading</div>
            <div className="grid sm:grid-cols-2 gap-4">
              {related.map((r) => (
                <Link key={r.slug} to={`/insights/${r.slug}`} className="block rounded-xl border border-white/10 p-5 hover:border-brand-cyan/40 transition-colors">
                  <div className="font-display font-semibold text-white mb-1.5">{r.title}</div>
                  <div className="text-sm text-white/55 line-clamp-2">{r.excerpt}</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </MarketingLayout>
  );
}

function articleJsonLd(post: Insight) {
  // Founder-bylined articles use a Person author for E-E-A-T; otherwise Organization.
  const author = post.authorTitle
    ? { "@type": "Person", name: post.author, jobTitle: post.authorTitle, worksFor: { "@type": "Organization", name: "Cruze" } }
    : { "@type": "Organization", name: post.author };
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    author,
    publisher: { "@type": "Organization", name: "Cruze", logo: { "@type": "ImageObject", url: `${SITE.url}/logo.png` } },
    datePublished: post.publishedAt,
    keywords: post.tags.join(", "),
    mainEntityOfPage: `${SITE.url}/insights/${post.slug}`,
  };
}
