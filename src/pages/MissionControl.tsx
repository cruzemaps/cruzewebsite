import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Activity, TrendingUp, ShieldCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

// We will import our three massive tab components here
import LiveFlowTab from "@/components/dashboard/LiveFlowTab";
import MarginalGainsTab from "@/components/dashboard/MarginalGainsTab";
import FleetHealthTab from "@/components/dashboard/FleetHealthTab";

const MissionControl = () => {
  return (
    <div className="min-h-screen bg-[#0B0E14] text-white overflow-y-auto">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 w-full px-6 py-4 border-b border-white/5 bg-[#0B0E14]/80 backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="inline-flex items-center justify-center p-2 rounded-full hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white/70" />
          </Link>
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Cruze" className="h-8 w-auto opacity-90" />
            <div className="h-4 w-px bg-white/20"></div>
            <span className="font-display font-medium text-lg tracking-wide text-white/90">
              Mission Control
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-cyan/10 border border-brand-cyan/20">
            <div className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse"></div>
            <span className="text-xs font-medium text-brand-cyan tracking-widest uppercase">Live Ops</span>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="container mx-auto px-6 py-8 max-w-7xl">
        <Tabs defaultValue="live-flow" className="w-full">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-2">
                Fleet Overview HQ
              </h1>
              <p className="text-white/50 text-sm md:text-base max-w-xl">
                Real-time telemetry, routing economics, and compliance metrics powered by Cruze's swarm intelligence network.
              </p>
            </div>
            
            <TabsList className="bg-white/5 border border-white/10 p-1 h-auto grid grid-cols-3 w-full md:w-[450px]">
              <TabsTrigger value="live-flow" className="data-[state=active]:bg-brand-cyan data-[state=active]:text-black rounded-md py-2 text-xs sm:text-sm">
                <Activity className="w-4 h-4 mr-2 hidden sm:block" /> Live Flow
              </TabsTrigger>
              <TabsTrigger value="marginal-gains" className="data-[state=active]:bg-brand-orange data-[state=active]:text-black rounded-md py-2 text-xs sm:text-sm">
                <TrendingUp className="w-4 h-4 mr-2 hidden sm:block" /> Financials
              </TabsTrigger>
              <TabsTrigger value="fleet-health" className="data-[state=active]:bg-white data-[state=active]:text-black rounded-md py-2 text-xs sm:text-sm">
                <ShieldCheck className="w-4 h-4 mr-2 hidden sm:block" /> Health & ESG
              </TabsTrigger>
            </TabsList>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <TabsContent value="live-flow" className="mt-0 outline-none">
              <LiveFlowTab />
            </TabsContent>
            
            <TabsContent value="marginal-gains" className="mt-0 outline-none">
              <MarginalGainsTab />
            </TabsContent>
            
            <TabsContent value="fleet-health" className="mt-0 outline-none">
              <FleetHealthTab />
            </TabsContent>
          </motion.div>
        </Tabs>
      </main>
    </div>
  );
};

export default MissionControl;
