import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, FileText, MessageCircle, Truck, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AppStatus = null | "pending" | "approved" | "denied";

const FleetDashboard = () => {
  const { user, signOut } = useAuth();
  const [status, setStatus] = useState<AppStatus>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [companyName, setCompanyName] = useState("");
  const [truckSize, setTruckSize] = useState("");
  const [fleetSize, setFleetSize] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchApplication = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('pilot_applications')
          .select('status')
          .eq('user_id', user.id)
          .maybeSingle(); // might not exist

        if (data && !error) {
          setStatus(data.status as AppStatus);
        }
      } catch (e) {
        console.error("No profile/app setup yet, showing form fallback");
      }
      setLoading(false);
    };
    fetchApplication();
  }, [user]);

  const handleSubmitPilot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    
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
      <nav className="relative z-10 w-full p-6 border-b border-white/5 bg-[#0B0E14]/50 backdrop-blur-md flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium tracking-wide">Back to Home</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-white/50 text-sm">{user?.email}</span>
          <Button variant="ghost" onClick={signOut} className="text-white hover:text-brand-orange hover:bg-transparent">
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

        {status === "pending" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center justify-center mt-20">
             <Card className="w-full max-w-lg bg-gradient-to-br from-white/10 to-transparent border-white/20 text-white backdrop-blur-xl text-center overflow-hidden">
               <div className="h-2 w-full bg-brand-orange/50 animate-pulse"></div>
               <CardContent className="p-10 flex flex-col items-center">
                  <div className="w-20 h-20 bg-brand-orange/10 rounded-full flex items-center justify-center mb-6">
                    <Clock className="w-10 h-10 text-brand-orange animate-spin-slow" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Application In Review</h2>
                  <p className="text-white/60">Your fleet application has been received by our mission control team. We are currently verifying your route telemetry and evaluating the pilot alignment.</p>
                  <p className="mt-8 text-sm text-white/40">We will contact you via email shortly.</p>
               </CardContent>
             </Card>
          </motion.div>
        )}
        
        {status === "approved" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
             <div className="p-8 bg-green-500/10 border border-green-500/30 rounded-2xl flex flex-col sm:flex-row items-center gap-6">
               <CheckCircle className="w-16 h-16 text-green-400 shrink-0" />
               <div>
                 <h2 className="text-2xl font-bold text-white mb-2">Pilot Deployment Approved</h2>
                 <p className="text-white/70">Your fleet is locked in. Click below to begin integrating your routing manifests into the Cruze API.</p>
                 <Button className="mt-4 bg-brand-cyan text-black hover:bg-brand-cyan/90 font-bold" onClick={() => window.alert("Navigating to setup wizard...")}>
                   See Next Steps
                 </Button>
               </div>
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
