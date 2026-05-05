import MarketingLayout from "@/components/marketing/MarketingLayout";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Image as ImageIcon, FileText, User } from "lucide-react";

const FACTS = [
  { label: "Founded", value: "2024" },
  { label: "HQ", value: "Austin, TX" },
  { label: "Stage", value: "Pilot deployments live" },
  { label: "Approach", value: "Swarm intelligence + physics-informed AI" },
];

export default function Press() {
  return (
    <MarketingLayout>
      <SEO />
      <section className="container mx-auto px-6 py-24 max-w-5xl">
        <h1 className="font-display text-4xl md:text-6xl font-bold mb-4">Press kit.</h1>
        <p className="text-white/60 mb-12 max-w-2xl text-lg">
          Logos, founder bios, fact sheet, and product screenshots for journalists, analysts, and partners covering Cruze.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <DownloadCard
            icon={<ImageIcon size={20} />}
            title="Brand assets"
            description="Logo (full color, mono, on-dark, on-light), wordmark, brand colors."
            href="/press/cruze-brand-assets.zip"
          />
          <DownloadCard
            icon={<FileText size={20} />}
            title="Fact sheet"
            description="One-page company overview, current pilot stats, leadership."
            href="/press/cruze-fact-sheet.pdf"
          />
          <DownloadCard
            icon={<User size={20} />}
            title="Founder bios + headshots"
            description="Print-ready 300dpi headshots and 150-word bios for each founder."
            href="/press/cruze-founders.zip"
          />
          <DownloadCard
            icon={<ImageIcon size={20} />}
            title="Product screenshots"
            description="High-resolution screenshots of Mission Control, Fleet Dashboard, and the consumer driver experience."
            href="/press/cruze-product-screens.zip"
          />
        </div>

        <Card className="bg-[#0F131C] border-white/10 mb-16">
          <CardContent className="p-8">
            <h2 className="font-display text-2xl font-bold mb-6">Fact sheet</h2>
            <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
              {FACTS.map((f) => (
                <div key={f.label} className="flex justify-between border-b border-white/5 pb-3">
                  <dt className="text-white/50 text-sm">{f.label}</dt>
                  <dd className="font-semibold">{f.value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <div className="rounded-2xl border border-white/10 p-8 bg-[#0B0E14]">
          <h2 className="font-display text-2xl font-bold mb-3">Press contact</h2>
          <p className="text-white/70">
            For interview requests, embargoed briefings, or expert quotes on traffic AI:
          </p>
          <a href="mailto:press@cruzemaps.com" className="text-brand-cyan font-semibold mt-2 inline-block">
            press@cruzemaps.com
          </a>
        </div>
      </section>
    </MarketingLayout>
  );
}

function DownloadCard({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="block group rounded-2xl border border-white/10 bg-[#0F131C] p-6 hover:border-brand-cyan/50 transition-colors"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-brand-cyan/10 text-brand-cyan flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-display font-semibold mb-1 flex items-center gap-2 group-hover:text-brand-cyan">
            {title} <Download size={14} className="opacity-50 group-hover:opacity-100" />
          </h3>
          <p className="text-white/60 text-sm">{description}</p>
        </div>
      </div>
    </a>
  );
}
