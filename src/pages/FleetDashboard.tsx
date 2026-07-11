import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import {
  FleetLoiCard,
  FleetNoApplicationPanel,
  FleetPilotStageContent,
} from "@/components/fleet/FleetPilotStagePanels";
import type { PilotApplicationRow, PilotLifecycleStatus } from "@/lib/pilotApplication";
import { PILOT_STATUS_LABELS } from "@/lib/pilotApplication";

type LOISummary = { id: string; signed_at: string; participant_company: string };

const FleetDashboard = () => {
  const { user, signOut } = useAuth();
  const [app, setApp] = useState<PilotApplicationRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [loi, setLoi] = useState<LOISummary | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchApplication = async () => {
      if (!user) return;

      if (sessionStorage.getItem("demo_role")) {
        const demoStatus = sessionStorage.getItem("demo_status") as PilotLifecycleStatus | null;
        if (!cancelled && demoStatus) {
          setApp({
            id: "demo",
            user_id: user.id,
            company_name: "Demo Fleet",
            truck_size: "Class 8",
            fleet_size: "50",
            status: demoStatus,
            website: null,
            primary_lanes: null,
            fms_provider: "Samsara",
            fms_other: null,
            contact_name: "Demo User",
            contact_email: user.email ?? null,
            contact_phone: null,
            contact_title: null,
            application_notes: null,
            fleet_visible_message: null,
            notes: null,
            created_at: new Date().toISOString(),
            reviewed_at: null,
          });
        }
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("pilot_applications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!cancelled && data && !error) {
          setApp(data as PilotApplicationRow);
        }
      } catch (e) {
        console.error("Fetch error:", e);
      }

      try {
        const { data: loiRow } = await supabase
          .from("loi_signatures")
          .select("id, signed_at, participant_company")
          .eq("user_id", user.id)
          .order("signed_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!cancelled && loiRow) setLoi(loiRow as LOISummary);
      } catch {
        /* optional card */
      }

      if (!cancelled) setLoading(false);
    };

    fetchApplication();

    let channel: ReturnType<typeof supabase.channel> | null = null;
    if (user && !sessionStorage.getItem("demo_role")) {
      channel = supabase
        .channel(`status_updates_${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "pilot_applications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (cancelled) return;
            const next = payload.new as PilotApplicationRow;
            setApp((prev) => (prev ? { ...prev, ...next } : next));
            const rawStatus = next.status as PilotLifecycleStatus;
            toast.info(`Application status: ${PILOT_STATUS_LABELS[rawStatus] ?? rawStatus}.`);
          }
        )
        .subscribe();
    }

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] text-white flex items-center justify-center">Loading…</div>
    );
  }

  const status = app?.status ?? null;

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white overflow-hidden relative">
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-brand-orange/10 rounded-full blur-[150px] pointer-events-none" />

      <nav className="relative z-50 w-full p-6 border-b border-white/5 bg-[#0B0E14]/50 backdrop-blur-md flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium tracking-wide">Back to Home</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/fleet-scores" className="text-white/70 hover:text-brand-orange transition-colors text-sm font-medium hidden sm:block">
            Driver scores
          </Link>
          <span className="text-white/50 text-sm hidden sm:block">{user?.email}</span>
          <Button variant="ghost" onClick={() => signOut()} className="text-white hover:text-brand-orange hover:bg-transparent">
            Sign Out
          </Button>
        </div>
      </nav>

      <main className="relative z-10 container mx-auto px-6 py-12 max-w-4xl">
        {!app && <FleetNoApplicationPanel />}

        {app && loi && <FleetLoiCard loi={loi} />}

        {app && status && <FleetPilotStageContent status={status} app={app} loi={loi} />}
      </main>

      <a
        href="mailto:hello@cruzemaps.com?subject=Fleet%20pilot%20question"
        className="fixed bottom-6 right-6 p-4 bg-brand-cyan text-black rounded-full shadow-2xl hover:scale-105 transition-transform z-50"
        aria-label="Email Cruze fleet support"
        title="Email hello@cruzemaps.com"
      >
        <MessageCircle className="w-6 h-6" />
      </a>
    </div>
  );
};

export default FleetDashboard;
