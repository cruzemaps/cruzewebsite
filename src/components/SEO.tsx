import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { SITE, findRouteMeta, resolveOgImage, type RouteMeta } from "@/lib/seo";

type Props = Partial<RouteMeta> & {
  ogImage?: string;
  canonicalOverride?: string;
};

export default function SEO(props: Props) {
  const location = useLocation();
  const fromManifest = findRouteMeta(location.pathname) ?? ({} as RouteMeta);

  const title = props.title ?? fromManifest.title ?? SITE.name;
  const description = props.description ?? fromManifest.description ?? SITE.shortDescription;
  const keywords = props.keywords ?? fromManifest.keywords;
  const ogImage = resolveOgImage(props.ogImage ?? fromManifest.ogImage);
  const noindex = props.noindex ?? fromManifest.noindex ?? false;
  const jsonLd = props.jsonLd ?? fromManifest.jsonLd;
  const canonical = props.canonicalOverride ?? `${SITE.url}${location.pathname === "/" ? "" : location.pathname}`;

  const jsonLdArray = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content={SITE.name} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content="website" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      {SITE.twitter && <meta name="twitter:site" content={SITE.twitter} />}

      <meta name="theme-color" content={SITE.themeColor} />

      {jsonLdArray.map((blob, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(blob)}
        </script>
      ))}
    </Helmet>
  );
}
