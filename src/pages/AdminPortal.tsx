import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Check, X, Building, Truck, Clock } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const AdminPortal = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    setLoading(true);
    
    if (localStorage.getItem("demo_role")) {
      setTimeout(() => {
        setApplications([
          { id: "mock-123", user_id: "demo-fleet-owner", company_name: "Swift Transport Logistics", truck_size: "Class 8 (80,000 lbs)", fleet_size: "1500" },
          { id: "mock-456", user_id: "demo-fleet-owner-2", company_name: "National Carrier Partners", truck_size: "Class 6", fleet_size: "350" }
        ]);
        setLoading(false);
      }, 500);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('pilot_applications')
        .select('*')
        .eq('status', 'pending');
        
      if (data && !error) {
        setApplications(data);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load applications. Make sure table is created.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const updateStatus = async (id: string, newStatus: 'approved' | 'denied') => {
    toast.info(`Marking application as ${newStatus}...`);
    try {
      const { error } = await supabase
        .from('pilot_applications')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success("Application updated successfully. (Email webhook should fire here)");
      // Remove from UI
      setApplications(prev => prev.filter(app => app.id !== id));
    } catch (e: any) {
      toast.error("Error updating status or missing admin privileges.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white">
      <nav className="p-6 border-b border-white/5 bg-[#0B0E14]/80 backdrop-blur-xl flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" /> Back to Home
        </Link>
        <span className="font-mono text-sm tracking-widest text-brand-orange">ADMIN SECURE PORTAL</span>
      </nav>

      <main className="container mx-auto px-6 py-12 max-w-5xl">
        <div className="mb-8">
           <h1 className="text-3xl font-display font-bold">Pilot Applications</h1>
           <p className="text-white/50">Review incoming fleet submissions for the speed harmonization rollout.</p>
        </div>

        {loading ? (
          <div className="animate-pulse flex items-center gap-2 text-brand-cyan"><Clock className="animate-spin w-4 h-4" /> Fetching DB...</div>
        ) : applications.length === 0 ? (
          <Card className="bg-white/5 border-white/10 text-white backdrop-blur-xl py-12 text-center">
            <CardContent>
              <div className="mx-auto w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-4">
                 <Check className="w-6 h-6 text-white/50" />
              </div>
              <h2 className="text-xl font-bold mb-1">Inbox Zero</h2>
              <p className="text-white/50 text-sm">No pending pilot applications at the moment.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <Card key={app.id} className="bg-white/5 border-white/10 text-white hover:border-white/20 transition-colors">
                 <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                       <h3 className="text-xl font-bold flex items-center gap-2 mb-3">
                         <Building className="w-5 h-5 text-brand-cyan" /> {app.company_name}
                       </h3>
                       <div className="flex flex-wrap gap-4 text-sm text-white/70">
                         <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full"><Truck className="w-4 h-4" /> Weight Class: {app.truck_size}</span>
                         <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full">Fleet Count: <strong className="text-white">{app.fleet_size}</strong></span>
                       </div>
                       <div className="text-xs text-white/40 mt-3 font-mono">
                         App ID: {app.id} | User: {app.user_id}
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                       <Button 
                         variant="outline" 
                         className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                         onClick={() => updateStatus(app.id, 'denied')}
                       >
                         <X className="w-4 h-4 mr-2" /> Deny
                       </Button>
                       <Button 
                         className="bg-brand-cyan text-black hover:bg-brand-cyan/90 font-bold"
                         onClick={() => updateStatus(app.id, 'approved')}
                       >
                         <Check className="w-4 h-4 mr-2" /> Approve Pilot
                       </Button>
                    </div>
                 </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPortal;
