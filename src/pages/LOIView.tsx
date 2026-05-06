import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Loader2, Download, ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import { useAuth } from "@/hooks/useAuth";

// /loi/:id renders a signed LOI as a printable, paper-styled page.
// Users hit "Download PDF" → opens browser print dialog → save as PDF.
// Modern browsers do this natively, no extra library needed.
//
// Access:
//   - User can view their own signed LOI (RLS enforced by Supabase)
//   - Admin can view any signed LOI

interface LOISig {
  id: string;
  user_id: string;
  pilot_application_id: string | null;
  participant_name: string;
  participant_company: string;
  participant_title: string | null;
  fleet_size: string;
  initials: string;
  signed_at: string;
  loi_version: string;
  loi_full_text: string;
  performance_fee_min_pct: number;
  performance_fee_max_pct: number;
  user_agent: string | null;
}

export default function LOIView() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [loi, setLoi] = useState<LOISig | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!id) {
      setNotFound(true);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("loi_signatures")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) {
        setNotFound(true);
      } else {
        setLoi(data as LOISig);
      }
      setLoading(false);
    })();
  }, [id, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand-cyan" />
      </div>
    );
  }
  if (!user) return <Navigate to={`/login?next=/loi/${id}`} replace />;
  if (notFound || !loi) return <Navigate to="/fleet-dashboard" replace />;

  const signedDate = new Date(loi.signed_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const signedTime = new Date(loi.signed_at).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return (
    <>
      <SEO title="Signed LOI | Cruze" noindex />

      {/* Print-only styles. The screen view shows on the dark site shell;
          when the user prints, only the white paper renders. */}
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .loi-paper {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 1in !important;
            max-width: none !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-[#0B0E14]">
        {/* Toolbar (hidden on print) */}
        <div className="no-print sticky top-0 z-50 border-b border-white/10 bg-[#0B0E14]/95 backdrop-blur">
          <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
            <Link to="/fleet-dashboard" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm">
              <ArrowLeft size={16} /> Back to dashboard
            </Link>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => window.print()}
                className="bg-brand-cyan text-[#0B0E14] hover:bg-brand-cyan/90"
              >
                <Download size={14} className="mr-2" /> Download PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="border-white/20 text-white hover:bg-white/5"
              >
                <Printer size={14} className="mr-2" /> Print
              </Button>
            </div>
          </div>
        </div>

        {/* Paper */}
        <div className="max-w-4xl mx-auto px-6 py-10 print:p-0 print:max-w-none">
          <div className="loi-paper bg-white text-gray-900 rounded-md shadow-2xl print:rounded-none print:shadow-none mx-auto" style={{ maxWidth: "8.5in", padding: "0.75in 1in" }}>
            {/* Header (logo + title) */}
            <div className="flex items-start justify-between mb-8 pb-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Cruze" className="w-12 h-12" />
                <div>
                  <div className="font-bold tracking-widest text-sm text-gray-900">CRUZE</div>
                  <div className="text-xs text-gray-500 mt-0.5">Cruzemaps · Austin, TX</div>
                </div>
              </div>
              <div className="text-right text-xs text-gray-500">
                <div>LOI version {loi.loi_version}</div>
                <div className="mt-0.5 font-mono">#{loi.id.slice(0, 8)}</div>
              </div>
            </div>

            {/* The LOI body — preserved verbatim from when they signed */}
            <pre
              className="whitespace-pre-wrap font-serif text-[13.5px] leading-[1.65] text-gray-800"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {loi.loi_full_text}
            </pre>

            {/* Signature panel */}
            <div className="mt-10 pt-6 border-t-2 border-gray-300 grid sm:grid-cols-2 gap-8">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-semibold">Participant Signature</div>
                <div className="font-serif italic text-2xl text-gray-900 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                  /s/ {loi.initials}
                </div>
                <div className="text-sm text-gray-700">{loi.participant_name}</div>
                {loi.participant_title && <div className="text-sm text-gray-600">{loi.participant_title}</div>}
                <div className="text-sm text-gray-600">{loi.participant_company}</div>
                <div className="text-xs text-gray-500 mt-2">
                  Signed electronically on {signedDate} at {signedTime}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-semibold">For Cruze</div>
                <div className="font-serif italic text-2xl text-gray-900 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                  /s/ AB
                </div>
                <div className="text-sm text-gray-700">Anudeep Bonagiri</div>
                <div className="text-sm text-gray-600">Founder, Cruzemaps</div>
                <div className="text-sm text-gray-600">Austin, Texas</div>
              </div>
            </div>

            {/* Audit footer */}
            <div className="mt-10 pt-4 border-t border-gray-200 text-[10px] text-gray-400 leading-relaxed">
              <div>
                Electronic signature audit: signature ID <span className="font-mono">{loi.id}</span> ·
                {" "}signed by user <span className="font-mono">{loi.user_id.slice(0, 8)}…</span>
                {loi.user_agent && <> · agent: <span className="font-mono">{loi.user_agent.slice(0, 60)}…</span></>}
              </div>
              <div className="mt-1">
                This document is the binding text of what was electronically agreed to. Cruze retains an immutable copy.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
