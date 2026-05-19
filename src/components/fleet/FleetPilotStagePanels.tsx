import type { ComponentType } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Clock,
  CheckCircle,
  FileSignature,
  Download,
  Mail,
  Calendar,
  Cable,
  BarChart3,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { PilotApplicationRow, PilotLifecycleStatus } from "@/lib/pilotApplication";
import { PendingExploreSection } from "./PendingExploreSection";

type LOISummary = { id: string; signed_at: string; participant_company: string };

export function FleetLoiCard({ loi }: { loi: LOISummary }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
      <Card className="bg-[#0F131C] border-white/10">
        <CardContent className="p-5 flex flex-wrap items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-brand-cyan/10 text-brand-cyan flex items-center justify-center flex-shrink-0">
            <FileSignature size={18} />
          </div>
          <div className="flex-1 min-w-[220px]">
            <div className="font-display font-semibold">Your signed Letter of Intent</div>
            <div className="text-xs text-white/50 mt-0.5">
              {loi.participant_company} · signed{" "}
              {new Date(loi.signed_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="border-white/15 text-white hover:bg-white/5">
            <Link to={`/loi/${loi.id}`}>
              <Download size={14} className="mr-2" /> View / Download
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function FleetMessageFromOps({ message }: { message: string }) {
  return (
    <Card className="mb-6 border-brand-cyan/30 bg-brand-cyan/5">
      <CardContent className="p-5">
        <div className="text-[11px] uppercase tracking-widest text-brand-cyan font-semibold mb-2">
          Message from Cruze
        </div>
        <p className="text-white/85 text-sm leading-relaxed whitespace-pre-wrap">{message}</p>
      </CardContent>
    </Card>
  );
}

function ApplicationSummary({ app }: { app: PilotApplicationRow }) {
  const rows = [
    ["Company", app.company_name],
    ["Fleet size", app.fleet_size],
    ["Truck class", app.truck_size],
    ["FMS", app.fms_provider ? `${app.fms_provider}${app.fms_other ? ` (${app.fms_other})` : ""}` : null],
  ].filter(([, v]) => v);

  if (rows.length === 0) return null;

  return (
    <Card className="mb-6 bg-white/[0.02] border-white/10">
      <CardContent className="p-5">
        <div className="text-[11px] uppercase tracking-widest text-white/45 font-semibold mb-3">
          Your application
        </div>
        <dl className="grid sm:grid-cols-2 gap-3 text-sm">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-white/40 text-xs">{label}</dt>
              <dd className="text-white/90 mt-0.5">{value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

export function FleetNoApplicationPanel() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-lg mx-auto">
      <h1 className="text-3xl font-display font-bold mb-3">Start your Cruze pilot application</h1>
      <p className="text-white/60 mb-8">
        Apply in five steps—including signing the LOI. We respond within two business days with a calibrated
        30-day pilot proposal.
      </p>
      <Button asChild className="bg-brand-orange text-[#0B0E14] hover:bg-brand-orange/90 font-bold">
        <Link to="/apply">Apply for the pilot</Link>
      </Button>
      <p className="mt-6 text-sm text-white/40">
        Questions?{" "}
        <a href="mailto:hello@cruzemaps.com" className="text-brand-cyan hover:underline">
          hello@cruzemaps.com
        </a>
      </p>
    </motion.div>
  );
}

export function FleetPilotStageContent({
  status,
  app,
  loi,
}: {
  status: PilotLifecycleStatus;
  app: PilotApplicationRow | null;
  loi: LOISummary | null;
}) {
  const opsMessage = app?.fleet_visible_message?.trim();

  if (status === "pending" || status === "in_review") {
    return (
      <motion.div className="space-y-8">
        {opsMessage && <FleetMessageFromOps message={opsMessage} />}
        {app && <ApplicationSummary app={app} />}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center"
        >
          <Card className="w-full max-w-2xl bg-gradient-to-br from-white/10 to-transparent border-white/20 text-white backdrop-blur-xl text-center overflow-hidden">
            <div className="h-2 w-full bg-brand-orange/50 animate-pulse" />
            <CardContent className="p-10 flex flex-col items-center">
              <div className="w-20 h-20 bg-brand-orange/10 rounded-full flex items-center justify-center mb-6">
                <Clock className="w-10 h-10 text-brand-orange" />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {status === "in_review" ? "Application under review" : "Application received"}
              </h2>
              <p className="text-white/60 max-w-md">
                {status === "in_review"
                  ? "Our team is reviewing your fleet profile and signed LOI."
                  : "Your application and LOI are on file. We typically begin review within two business days."}
              </p>
              <p className="mt-6 text-sm text-white/40 flex items-center gap-2 justify-center">
                <Mail size={14} /> We'll email you at {app?.contact_email || "the address on your account"} with next steps.
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <PendingExploreSection />
      </motion.div>
    );
  }

  if (status === "approved") {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {opsMessage && <FleetMessageFromOps message={opsMessage} />}
        {app && <ApplicationSummary app={app} />}
        <StatusBanner
          variant="success"
          icon={CheckCircle}
          title="Pilot deployment approved"
          body="You're locked in for the Cruze 30-day pilot. Our team will coordinate kickoff and FMS integration—watch your email and the message above for scheduling."
        />
        <ActionCards
          items={[
            {
              icon: Calendar,
              title: "Schedule kickoff",
              body: "Reply to your Cruze contact or email hello@cruzemaps.com to book your technical kickoff.",
              href: "mailto:hello@cruzemaps.com?subject=Pilot%20kickoff%20scheduling",
              label: "Email to schedule",
              external: true,
            },
            {
              icon: Cable,
              title: "Prepare telematics access",
              body: app?.fms_provider
                ? `We'll integrate alongside ${app.fms_provider}. Have an admin contact ready for read-only API or export access.`
                : "Have your FMS admin contact ready for read-only telematics access.",
            },
          ]}
        />
      </motion.div>
    );
  }

  if (status === "onboarding") {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {opsMessage && <FleetMessageFromOps message={opsMessage} />}
        {app && <ApplicationSummary app={app} />}
        <StatusBanner
          variant="success"
          icon={CheckCircle}
          title="Onboarding in progress"
          body="We're connecting to your fleet systems and preparing the 30-day pilot window. Your Cruze contact will confirm when drivers can go live."
        />
        <OnboardingChecklist fms={app?.fms_provider} />
      </motion.div>
    );
  }

  if (status === "active") {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {opsMessage && <FleetMessageFromOps message={opsMessage} />}
        <StatusBanner
          variant="success"
          icon={CheckCircle}
          title="Pilot active"
          body="Your fleet is enrolled in Cruze coordination for the 30-day pilot. Detailed telematics dashboards are rolling out—your Cruze contact shares weekly impact summaries until self-serve metrics are live here."
        />
        <Card className="bg-[#0F131C] border-white/10">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <BarChart3 className="w-10 h-10 text-brand-cyan flex-shrink-0" />
              <div>
                <h3 className="font-display font-semibold text-lg mb-1">Pilot impact (coming soon)</h3>
                <p className="text-white/55 text-sm leading-relaxed mb-4">
                  Live fuel, hours-reclaimed, and coordination metrics will appear on this dashboard. Until then,
                  your weekly pilot report is delivered by email.
                </p>
                <Button asChild variant="outline" size="sm" className="border-white/15 text-white">
                  <a href="mailto:hello@cruzemaps.com?subject=Pilot%20weekly%20report">
                    Request this week's report
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (status === "denied") {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {opsMessage && <FleetMessageFromOps message={opsMessage} />}
        <StatusBanner
          variant="danger"
          icon={AlertCircle}
          title="Not selected for this cohort"
          body="We reviewed your application but can't include your fleet in the current pilot cohort. You're welcome to reach out about future cohorts or alternative programs."
        />
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" className="border-white/15 text-white">
            <a href="mailto:hello@cruzemaps.com?subject=Future%20pilot%20cohort">Contact Cruze</a>
          </Button>
          <Button asChild className="bg-brand-orange text-[#0B0E14]">
            <Link to="/apply">Submit a new application</Link>
          </Button>
        </div>
      </motion.div>
    );
  }

  if (status === "archived") {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {opsMessage && <FleetMessageFromOps message={opsMessage} />}
        <StatusBanner
          variant="muted"
          icon={AlertCircle}
          title="Application archived"
          body="This application is closed. Start a new conversation if you'd like to explore a future pilot."
        />
        <Button asChild className="bg-brand-orange text-[#0B0E14]">
          <Link to="/apply">Apply again</Link>
        </Button>
      </motion.div>
    );
  }

  return null;
}

function StatusBanner({
  variant,
  icon: Icon,
  title,
  body,
}: {
  variant: "success" | "danger" | "muted";
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  const styles = {
    success: "bg-green-500/10 border-green-500/30 text-green-400",
    danger: "bg-red-500/10 border-red-500/30 text-red-400",
    muted: "bg-white/5 border-white/10 text-white/70",
  };
  return (
    <div className={`p-8 border rounded-2xl flex flex-col sm:flex-row items-start gap-6 ${styles[variant]}`}>
      <Icon className="w-14 h-14 shrink-0" />
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-white/70 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

function ActionCards({
  items,
}: {
  items: {
    icon: ComponentType<{ className?: string }>;
    title: string;
    body: string;
    href?: string;
    label?: string;
    external?: boolean;
  }[];
}) {
  return (
    <motion.div className="grid md:grid-cols-2 gap-4">
      {items.map((item) => (
        <Card key={item.title} className="bg-[#0F131C] border-white/10">
          <CardContent className="p-5">
            <item.icon className="w-8 h-8 text-brand-cyan mb-3" />
            <h3 className="font-display font-semibold mb-2">{item.title}</h3>
            <p className="text-white/55 text-sm mb-4">{item.body}</p>
            {item.href && item.label && (
              <Button asChild size="sm" variant="outline" className="border-white/15 text-white">
                <a href={item.href} {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                  {item.label}
                  {item.external && <ExternalLink size={12} className="ml-2" />}
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );
}

function OnboardingChecklist({ fms }: { fms?: string | null }) {
  const steps = [
    "Kickoff call completed with Cruze technical lead",
    fms ? `Read-only ${fms} access provisioned` : "Telematics / FMS read access provisioned",
    "Driver briefing materials sent to your ops team",
    "Pilot corridor and vehicle list confirmed",
    "Go-live date scheduled",
  ];
  return (
    <Card className="bg-[#0F131C] border-white/10">
      <CardContent className="p-6">
        <h3 className="font-display font-semibold text-lg mb-4">Onboarding checklist</h3>
        <ul className="space-y-3">
          {steps.map((step) => (
            <li key={step} className="flex items-start gap-3 text-sm text-white/75">
              <span className="w-5 h-5 rounded-full border border-white/20 flex-shrink-0 mt-0.5" />
              {step}
            </li>
          ))}
        </ul>
        <p className="text-xs text-white/40 mt-4">
          Your Cruze contact will mark items complete and move you to Active when the pilot is live.
        </p>
      </CardContent>
    </Card>
  );
}
