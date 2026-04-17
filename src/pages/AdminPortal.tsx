import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Check, X, Building, Truck, Clock, Activity, Network, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const AdminPortal = () => {
  const [allApplications, setAllApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    setLoading(true);
    
    if (localStorage.getItem("demo_role")) {
      setTimeout(() => {
        setAllApplications([
          { id: "mock-123", user_id: "demo-1", company_name: "Swift Transport Logistics", truck_size: "Class 8", fleet_size: "1500", status: 'pending' },
          { id: "mock-456", user_id: "demo-2", company_name: "National Carrier Partners", truck_size: "Class 6", fleet_size: "350", status: 'pending' },
          { id: "mock-789", user_id: "demo-3", company_name: "Alpha Freight", truck_size: "Class 8", fleet_size: "2000", status: 'approved' }
        ]);
        setLoading(false);
      }, 500);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('pilot_applications')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (data && !error) {
        setAllApplications(data);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load applications. Make sure table is created.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApplications();

    if (!localStorage.getItem("demo_role")) {
      const channel = supabase
        .channel('admin_live_feed')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pilot_applications' }, (payload) => {
           if (payload.eventType === 'INSERT') {
               setAllApplications(prev => [payload.new, ...prev]);
               toast.success(`Live Telemetry: New pilot application received from ${payload.new.company_name}!`);
           }
           if (payload.eventType === 'UPDATE') {
               setAllApplications(prev => prev.map(a => a.id === payload.new.id ? payload.new : a));
           }
           if (payload.eventType === 'DELETE') {
               setAllApplications(prev => prev.filter(a => a.id !== payload.old.id));
           }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  const updateStatus = async (id: string, newStatus: 'approved' | 'denied') => {
    toast.info(`Transmitting ${newStatus} status to node...`);
    try {
      if (localStorage.getItem("demo_role")) {
        setAllApplications(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
        toast.success("Command Executed. Dashboard updating live.");
        return;
      }

      const { error } = await supabase
        .from('pilot_applications')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success("Pilot Node sync complete.");
    } catch (e: any) {
      toast.error("Access Denied: Missing clearance privileges.");
    }
  };

  // Telemetry Parsers
  const pendingApps = allApplications.filter(a => a.status === 'pending');
  const approvedApps = allApplications.filter(a => a.status === 'approved');
  const totalNetworkVehicles = approvedApps.reduce((sum, app) => sum + parseInt(app.fleet_size || "0", 10), 0);

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white">
      <nav className="p-6 border-b border-white/5 bg-[#0B0E14]/80 backdrop-blur-xl flex items-center justify-between sticky top-0 z-50">
        <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" /> Back to Home
        </Link>
        <span className="font-mono text-sm tracking-widest text-brand-orange flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-orange animate-pulse"></span>
          CENTRAL COMMAND
        </span>
      </nav>

      <main className="container mx-auto px-6 py-12 max-w-6xl">
        <div className="mb-10">
           <h1 className="text-4xl font-display font-bold mb-3 flex items-center gap-3">
             <Activity className="w-8 h-8 text-brand-cyan" /> Network Telemetry
           </h1>
           <p className="text-white/50 text-lg">Real-time status of all active operator nodes and fleet integrations.</p>
        </div>

        {/* Live Telemetry Heads Up Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-brand-cyan/5 border-brand-cyan/20 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-brand-cyan mb-2">
                <Network className="w-5 h-5" />
                <h3 className="font-bold tracking-wider text-sm uppercase">Active Network Nodes</h3>
              </div>
              <p className="text-4xl font-display font-bold text-white">{approvedApps.length}</p>
              <p className="text-white/40 text-sm mt-1">Live corporate integrators</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-xl relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-white/70 mb-2">
                <Truck className="w-5 h-5" />
                <h3 className="font-bold tracking-wider text-sm uppercase">Approved Vehicles</h3>
              </div>
              <p className="text-4xl font-display font-bold text-white">{totalNetworkVehicles.toLocaleString()}</p>
              <p className="text-white/40 text-sm mt-1">Total synchronized units</p>
            </CardContent>
          </Card>

          <Card className="bg-brand-orange/5 border-brand-orange/20 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-brand-orange mb-2">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="font-bold tracking-wider text-sm uppercase">Pending Actions</h3>
              </div>
              <p className="text-4xl font-display font-bold text-white">{pendingApps.length}</p>
              <p className="text-white/40 text-sm mt-1">Awaiting security clearance</p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 flex space-x-4 items-end justify-between border-b border-white/10 pb-4">
           <div>
             <h2 className="text-2xl font-display font-bold tracking-tight">Access Requests</h2>
             <p className="text-white/50 text-sm mt-1">Live incoming requests mapping natively via web socket directly to Central Command.</p>
           </div>
           {loading && <div className="text-brand-cyan text-sm flex items-center gap-2"><Clock className="w-4 h-4 animate-spin" /> Syncing</div>}
        </div>

        {pendingApps.length === 0 && !loading ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/5 border border-white/10 rounded-xl py-16 text-center">
             <div className="mx-auto w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-white/30" />
             </div>
             <h2 className="text-xl font-bold mb-2">Network Secure - Inbox Zero</h2>
             <p className="text-white/40">All operator nodes have been successfully synchronized.</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {pendingApps.map((app) => (
                <motion.div
                  key={app.id} 
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="bg-gradient-to-r from-white/5 to-transparent border-l-4 border-l-brand-orange border-y-white/5 border-r-white/5 text-white hover:bg-white/10 transition-colors">
                     <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-1">
                           <h3 className="text-xl font-bold flex items-center gap-2 mb-3">
                             <Building className="w-5 h-5 text-brand-orange" /> {app.company_name}
                           </h3>
                           <div className="flex flex-wrap gap-4 text-sm text-white/70">
                             <span className="flex items-center gap-1 bg-black/40 px-3 py-1 rounded-full border border-white/5"><Truck className="w-4 h-4" /> Size: {app.truck_size}</span>
                             <span className="flex items-center gap-1 bg-black/40 px-3 py-1 rounded-full border border-white/5">Requested Nodes: <strong className="text-white ml-1">{app.fleet_size}</strong></span>
                           </div>
                           <div className="text-xs text-white/30 mt-4 font-mono select-all">
                             NODE_ID: {app.id} | AUTH_REF: {app.user_id}
                           </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                           <Button 
                             variant="outline" 
                             className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                             onClick={() => updateStatus(app.id, 'denied')}
                           >
                             <X className="w-4 h-4 mr-2" /> Block
                           </Button>
                           <Button 
                             className="bg-brand-cyan text-black hover:bg-brand-cyan/90 font-bold transition-transform active:scale-95"
                             onClick={() => updateStatus(app.id, 'approved')}
                           >
                             <Check className="w-4 h-4 mr-2" /> Authorize Integration
                           </Button>
                        </div>
                     </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPortal;
