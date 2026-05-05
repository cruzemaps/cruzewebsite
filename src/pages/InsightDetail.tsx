import { useEffect } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import MarketingLayout from "@/components/marketing/MarketingLayout";
import SEO from "@/components/SEO";
import { ArrowLeft } from "lucide-react";
import { findInsight, type Insight } from "@/content/insights";
import { SITE } from "@/lib/seo";
import { track } from "@/lib/analytics";

export default function InsightDetail() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? findInsight(slug) : undefined;

  useEffect(() => {
    if (post) track("insight_viewed", { slug: post.slug });
  }, [post]);

  if (!post) return <Navigate to="/insights" replace />;

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
          <div className="flex flex-wrap items-center gap-3 text-white/50 text-sm">
            <span>{post.author}</span>
            <span>·</span>
            <time>{new Date(post.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</time>
          </div>
        </header>

        <div>
          {post.body.split("\n\n").map((para, i) => (
            <p key={i} className="text-white/80 leading-relaxed mb-6">{para}</p>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-white/10">
          {post.tags.map((t) => (
            <span key={t} className="text-xs text-white/50 bg-white/5 px-3 py-1 rounded-full">{t}</span>
          ))}
        </div>
      </article>
    </MarketingLayout>
  );
}

function articleJsonLd(post: Insight) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    author: { "@type": "Organization", name: post.author },
    publisher: { "@type": "Organization", name: "Cruze", logo: { "@type": "ImageObject", url: `${SITE.url}/logo.png` } },
    datePublished: post.publishedAt,
    keywords: post.tags.join(", "),
    mainEntityOfPage: `${SITE.url}/insights/${post.slug}`,
  };
}
