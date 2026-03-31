import React, { useState, useEffect } from "react";
import NavbarV2 from "@/components/v2/NavbarV2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Terminal, Settings, Database, Activity, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const InternTesting = () => {
  const [swarmDensity, setSwarmDensity] = useState(40);
  const [activeNodes, setActiveNodes] = useState(128);
  const [logs, setLogs] = useState<string[]>(["[SYSTEM] Kernel initialized.", "[BRIDGE] Connection to simulation server established.", "[AUTH] Intern access granted."]);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        const newLog = `[MSG] Swarm heartbeat: ${Math.floor(Math.random() * 1000)}ms | Density: ${swarmDensity}%`;
        setLogs(prev => [newLog, ...prev].slice(0, 50));
        setActiveNodes(prev => Math.max(0, Math.min(500, prev + (Math.random() > 0.5 ? 1 : -1))));
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [isRunning, swarmDensity]);

  const toggleSimulation = () => {
    setIsRunning(!isRunning);
    setLogs(prev => [`[SYSTEM] ${!isRunning ? "Starting" : "Stopping"} simulation...`, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white/90 font-body p-6">
      <NavbarV2 />
      
      <div className="max-w-7xl mx-auto pt-24 space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-display font-bold">Internal Sandbox v2.4.0</h1>
              <Badge variant="secondary" className="bg-brand-orange/20 text-brand-orange border-brand-orange/30">Stable Build</Badge>
            </div>
            <p className="text-white/40">Restricted access environment for Cruze R&D interns.</p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
                variant={isRunning ? "destructive" : "secondary"} 
                className="font-mono h-12 px-6"
                onClick={toggleSimulation}
            >
              <RefreshCw className={`mr-2 w-4 h-4 ${isRunning ? "animate-spin" : ""}`} />
              {isRunning ? "PAUSE SIMULATION" : "INITIATE SIMULATION"}
            </Button>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Controls */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="bg-white/5 border-white/10 rounded-3xl overflow-hidden">
              <CardHeader className="bg-white/5 border-b border-white/10">
                <CardTitle className="flex items-center gap-2 text-lg font-display">
                  <Settings className="w-5 h-5 text-brand-orange" /> Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-10">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-white/60">Swarm Density</label>
                    <span className="font-mono text-brand-orange">{swarmDensity}%</span>
                  </div>
                  <Slider 
                    value={[swarmDensity]} 
                    onValueChange={(val) => setSwarmDensity(val[0])} 
                    max={100} 
                    step={1}
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-white/60">Node Propagation Delay</label>
                    <span className="font-mono text-brand-orange">12ms</span>
                  </div>
                  <Slider defaultValue={[12]} max={200} step={1} />
                </div>

                <div className="pt-4 space-y-3">
                  <Button variant="outline" className="w-full justify-start gap-3 border-white/10 bg-white/5 h-12">
                     <Database className="w-4 h-4 text-white/40" /> Wipe Local Cache
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-3 border-white/10 bg-white/5 h-12">
                     <Activity className="w-4 h-4 text-white/40" /> Export JSON Telemetry
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Monitoring */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { label: "Active Nodes", value: activeNodes, unit: "" },
                { label: "Network Load", value: isRunning ? "4.2" : "0.0", unit: "MB/s" },
                { label: "Latency", value: isRunning ? "8.4" : "--", unit: "ms" }
              ].map((stat, i) => (
                <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/10">
                  <p className="text-sm text-white/40 mb-1">{stat.label}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-display font-bold text-white">{stat.value}</span>
                    <span className="text-xs text-white/20 font-mono tracking-tighter uppercase">{stat.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Terminal Panel */}
            <Card className="flex-1 bg-black/40 border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              <CardHeader className="bg-[#1A1F26] border-b border-white/10 py-4 px-6 flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-mono tracking-tighter text-white/60">
                   <Terminal className="w-4 h-4" /> LIVE KERNEL LOGS
                </CardTitle>
                <div className="flex gap-2">
                   <div className="w-2.5 h-2.5 rounded-full bg-red-400/50" />
                   <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/50" />
                   <div className="w-2.5 h-2.5 rounded-full bg-green-400/50" />
                </div>
              </CardHeader>
              <CardContent className="p-6 h-[400px] overflow-y-auto font-mono text-sm space-y-1 custom-scrollbar">
                <AnimatePresence initial={false}>
                  {logs.map((log, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`${log.includes("[SYSTEM]") ? "text-brand-orange" : log.includes("[BRIDGE]") ? "text-blue-400" : "text-white/40"}`}
                    >
                      {log}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <style>
        {`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        `}
      </style>
    </div>
  );
};

export default InternTesting;
