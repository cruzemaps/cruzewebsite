import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, FileText, MessageCircle, Truck, Clock, CheckCircle, FileSignature, Download } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AppStatus = null | "pending" | "in_review" | "approved" | "onboarding" | "active" | "denied" | "archived";

type LOISummary = { id: string; signed_at: string; participant_company: string };

const FleetDashboard = () => {
  const { user, signOut } = useAuth();
  const [status, setStatus] = useState<AppStatus>(null);
  const [loading, setLoading] = useState(true);
  const [loi, setLoi] = useState<LOISummary | null>(null);

  // Form State
  const [companyName, setCompanyName] = useState("");
  const [truckSize, setTruckSize] = useState("");
  const [fleetSize, setFleetSize] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchApplication = async () => {
      if (!user) return;
      
      const isDemo = sessionStorage.getItem("demo_role") || localStorage.getItem("demo_role");
      
      if (isDemo) {
        const demoStatus = (sessionStorage.getItem("demo_status") || localStorage.getItem("demo_status")) as AppStatus;
        if (demoStatus) setStatus(demoStatus);
        setLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('pilot_applications')
          .select('status')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data && !error) {
          setStatus(data.status as AppStatus);
        }
      } catch (e) {
        console.error("Fetch error:", e);
      }

      // Fetch latest signed LOI for the "Your LOI" card.
      try {
        const { data: loiRow } = await supabase
          .from("loi_signatures")
          .select("id, signed_at, participant_company")
          .eq("user_id", user.id)
          .order("signed_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (loiRow) setLoi(loiRow as LOISummary);
      } catch {
        // ignore — card just won't render
      }
      setLoading(false);
    };

    fetchApplication();

    // REAL-TIME STATUS LISTENER
    if (user && !(sessionStorage.getItem("demo_role") || localStorage.getItem("demo_role"))) {
      const channel = supabase
        .channel(`status_updates_${user.id}`)
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'pilot_applications',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          setStatus(payload.new.status as AppStatus);
          toast.info(`Status Update: Your application is now ${payload.new.status}!`);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const handleSubmitPilot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    
    if (sessionStorage.getItem("demo_role") || localStorage.getItem("demo_role")) {
      setTimeout(() => {
        toast.success("Demo Application submitted successfully.");
        sessionStorage.setItem("demo_status", "pending");
        setStatus("pending");
        setSubmitting(false);
      }, 800);
      return;
    }
    
    // Optimistic fallback for frontend simulation if DB not configured yet
    try {
      const { error } = await supabase
        .from('pilot_applications')
        .insert({
          user_id: user.id,
          company_name: companyName,
          truck_size: truckSize,
          fleet_size: fleetSize,
          status: 'pending'
        });

      if (error) throw error;
      toast.success("Application submitted successfully.");
      setStatus("pending");
    } catch (e: any) {
      console.warn("DB not connected or table missing, mocking pending state locally.");
      toast.success("Application submitted successfully. (Mocked locally)");
      setStatus("pending");
    }
    setSubmitting(false);
  };

  if (loading) {
     return <div className="min-h-screen bg-[#0B0E14] text-white flex items-center justify-center">Loading Data...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white overflow-hidden relative">
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-brand-orange/10 rounded-full blur-[150px] pointer-events-none" />
      
      {/* Navbar */}
      <nav className="relative z-50 w-full p-6 border-b border-white/5 bg-[#0B0E14]/50 backdrop-blur-md flex items-center justify-between pointer-events-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium tracking-wide">Back to Home</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-white/50 text-sm hidden sm:block">{user?.email}</span>
          <Button
            variant="ghost"
            onClick={() => signOut()}
            className="text-white hover:text-brand-orange hover:bg-transparent"
          >
            Sign Out
          </Button>
        </div>
      </nav>

      {/* Main Content Area based on Status */}
      <main className="relative z-10 container mx-auto px-6 py-12 max-w-4xl">
        
        {status === null && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-display font-bold mb-2">Fleet Pilot Application</h1>
            <p className="text-white/60 mb-8">Register your fleet details to participate in the hardware-free speed harmonization pilot.</p>
            
            <div className="grid md:grid-cols-2 gap-8">
               <Card className="bg-white/5 border-white/10 text-white backdrop-blur-lg">
                 <CardHeader>
                    <CardTitle>Fleet Logistics Form</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <form onSubmit={handleSubmitPilot} className="space-y-4">
                     <div className="space-y-2">
                       <Label>Company / Fleet Name</Label>
                       <Input required value={companyName} onChange={e=>setCompanyName(e.target.value)} className="bg-white/5 border-white/10 text-white" />
                     </div>
                     <div className="space-y-2">
                       <Label>Primary Truck Weight Class</Label>
                       <Input required placeholder="Class 8 (e.g. 80,000 lbs)" value={truckSize} onChange={e=>setTruckSize(e.target.value)} className="bg-white/5 border-white/10 text-white" />
                     </div>
                     <div className="space-y-2">
                       <Label>Total Active Vehicles (Fleet Size)</Label>
                       <Input required type="number" value={fleetSize} onChange={e=>setFleetSize(e.target.value)} className="bg-white/5 border-white/10 text-white" />
                     </div>
                     <Button type="submit" disabled={submitting} className="w-full bg-brand-orange text-black font-bold hover:bg-brand-orange/90 mt-4">
                       {submitting ? "Submitting..." : "Submit Pilot Request"}
                     </Button>
                   </form>
                 </CardContent>
               </Card>

               <div className="flex flex-col gap-4">
                 <Card className="bg-gradient-to-br from-brand-cyan/10 to-transparent border-brand-cyan/20 text-white backdrop-blur-lg h-1/2">
                   <CardContent className="h-full flex flex-col items-center justify-center p-6 text-center">
                     <FileText className="w-12 h-12 text-brand-cyan mb-4" />
                     <h3 className="font-bold text-lg mb-2">Cruze Pilot Information Kit</h3>
                     <p className="text-sm text-white/60 mb-4">Learn why and how we reduce $11k in fuel spend per truck annually.</p>
                     <Button variant="outline" className="border-brand-cyan text-brand-cyan hover:bg-brand-cyan/10" onClick={() => window.alert("Dummy PDF downloaded!")}>
                       Download PDF
                     </Button>
                   </CardContent>
                 </Card>
                 
                 <Card className="bg-white/5 border-white/10 text-white backdrop-blur-lg h-1/2 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => window.alert("Opening Live Chat widget...")}>
                   <CardContent className="h-full flex items-center gap-4 p-6">
                     <div className="p-3 bg-white/10 rounded-full">
                       <MessageCircle className="w-6 h-6 text-white" />
                     </div>
                     <div>
                       <h3 className="font-bold text-lg">Need Assistance?</h3>
                       <p className="text-sm text-white/50">Chat live with our routing specialists.</p>
                     </div>
                   </CardContent>
                 </Card>
               </div>
            </div>
          </motion.div>
        )}

        {loi && (
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
                    {new Date(loi.signed_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
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
        )}

        {(status === "pending" || status === "in_review") && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center justify-center mt-20">
             <Card className="w-full max-w-lg bg-gradient-to-br from-white/10 to-transparent border-white/20 text-white backdrop-blur-xl text-center overflow-hidden">
               <div className="h-2 w-full bg-brand-orange/50 animate-pulse"></div>
               <CardContent className="p-10 flex flex-col items-center">
                  <div className="w-20 h-20 bg-brand-orange/10 rounded-full flex items-center justify-center mb-6">
                    <Clock className="w-10 h-10 text-brand-orange animate-spin-slow" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">{status === "in_review" ? "Application Under Review" : "Application Received"}</h2>
                  <p className="text-white/60">{status === "in_review"
                    ? "Our mission control team is currently verifying your route telemetry and evaluating pilot alignment."
                    : "Your fleet application has been received. We will move it into review shortly."}</p>
                  <p className="mt-8 text-sm text-white/40">We will contact you via email with next steps.</p>
               </CardContent>
             </Card>
          </motion.div>
        )}

        {(status === "approved" || status === "onboarding" || status === "active") && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
             <div className="p-8 bg-green-500/10 border border-green-500/30 rounded-2xl flex flex-col sm:flex-row items-center gap-6">
               <CheckCircle className="w-16 h-16 text-green-400 shrink-0" />
               <div>
                 <h2 className="text-2xl font-bold text-white mb-2">
                   {status === "active" ? "Pilot Active" : status === "onboarding" ? "Onboarding in Progress" : "Pilot Deployment Approved"}
                 </h2>
                 <p className="text-white/70">
                   {status === "active"
                     ? "Your fleet is live on Cruze coordination. Track impact and route metrics from your dashboard."
                     : status === "onboarding"
                     ? "Integration with your FMS is underway. Our team will reach out for kickoff shortly."
                     : "Your fleet is locked in. Click below to begin integrating your routing manifests into the Cruze API."}
                 </p>
               </div>
             </div>
          </motion.div>
        )}

        {status === "denied" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
             <div className="p-8 bg-red-500/10 border border-red-500/30 rounded-2xl">
               <h2 className="text-2xl font-bold text-white mb-2">Application Not Selected for Pilot Cohort</h2>
               <p className="text-white/70">Your application was reviewed but not selected for the current pilot cohort. Contact us at <a href="mailto:hello@cruzemaps.com" className="text-brand-cyan">hello@cruzemaps.com</a> to discuss alternative paths or future cohorts.</p>
             </div>
          </motion.div>
        )}

        {status === "archived" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
             <div className="p-8 bg-white/5 border border-white/10 rounded-2xl">
               <h2 className="text-2xl font-bold text-white mb-2">Application Archived</h2>
               <p className="text-white/70">This application has been archived. To start a new pilot conversation, email <a href="mailto:hello@cruzemaps.com" className="text-brand-cyan">hello@cruzemaps.com</a>.</p>
             </div>
          </motion.div>
        )}

      </main>

      {/* Floating Chat Dummy Button */}
      <button 
        onClick={() => window.alert("Opening Live Chat...")}
        className="fixed bottom-6 right-6 p-4 bg-brand-cyan text-black rounded-full shadow-2xl hover:scale-105 transition-transform z-50 flex items-center justify-center"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

    </div>
  );
};

export default FleetDashboard;
