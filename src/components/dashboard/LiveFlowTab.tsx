import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { ShieldAlert, Network, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

// Mock data for live nodes
const LIVE_NODES = [
  { id: 1, coords: [-122.4194, 37.7749], status: "dissolving", label: "I-80 (CA)" }, // SF
  { id: 2, coords: [-97.7431, 30.2672], status: "shockwave", label: "I-35 (TX)" },   // Austin
  { id: 3, coords: [-84.3880, 33.7490], status: "dissolving", label: "I-85 (GA)" },  // Atlanta
  { id: 4, coords: [-74.0060, 40.7128], status: "shockwave", label: "I-95 (NY)" },   // NYC
  { id: 5, coords: [-87.6298, 41.8781], status: "monitoring", label: "I-90 (IL)" },  // Chicago
];

const PRE_SCRIPTED_LOGS = [
  "System Initialized. Awaiting node telemetry...",
  "Agent 402: Speed Harmonization Active on I-80.",
  "Node 14 (TX): Shockwave detected. Dispersing instructions to edge vehicles.",
  "Agent 89: Flow Stability reached 92%.",
  "Agent 105 (NY): Sudden braking wave intercepted. Harmonizing...",
  "Node 03 (GA): Throughput optimized by 14%.",
];

const LiveFlowTab = () => {
  const [logs, setLogs] = useState<string[]>(PRE_SCRIPTED_LOGS);
  const [brakingEvents, setBrakingEvents] = useState(1482);
  const [activeAgents, setActiveAgents] = useState(342);

  // We are pivoting from a fake real-time ops dashboard to a static "Pilot Projection" presentation
  // The logs and metrics will remain static representations of the case study.

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Active Pacing Zones Map */}
      <Card className="lg:col-span-2 bg-[#1A1F2B]/50 backdrop-blur-xl border-white/10 text-white overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Network className="w-5 h-5 text-brand-cyan" /> Active Pacing Zones
              </CardTitle>
              <CardDescription className="text-white/50">Real-time shockwave mapping across managed corridors.</CardDescription>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Shockwave</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" /> Dissolving</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full aspect-[2/1] relative flex items-center justify-center p-2">
            <ComposableMap projection="geoAlbersUsa" className="w-full h-full opacity-80">
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#2D3748"
                      stroke="#1A1F2B"
                      strokeWidth={0.5}
                      className="outline-none"
                    />
                  ))
                }
              </Geographies>
              
              {LIVE_NODES.map((node) => (
                <Marker key={node.id} coordinates={node.coords as [number, number]}>
                   {node.status === "shockwave" && (
                     <g>
                       <circle r={12} fill="#ef4444" opacity={0.3} className="animate-ping" />
                       <circle r={4} fill="#ef4444" />
                     </g>
                   )}
                   {node.status === "dissolving" && (
                     <g>
                       <circle r={16} fill="#00E5FF" opacity={0.2} className="animate-pulse" />
                       <circle r={4} fill="#00E5FF" />
                     </g>
                   )}
                   {node.status === "monitoring" && (
                     <circle r={3} fill="#ffffff" opacity={0.5} />
                   )}
                </Marker>
              ))}
            </ComposableMap>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-6">
        {/* Safety Metrics KPIs */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-brand-orange/10 to-transparent border-brand-orange/20 text-white backdrop-blur-xl">
            <CardContent className="p-4 flex flex-col justify-center items-center text-center">
              <ShieldAlert className="w-6 h-6 text-brand-orange mb-2" />
              <div className="text-3xl font-display font-bold">{brakingEvents.toLocaleString()}</div>
              <div className="text-xs text-white/60 mt-1">Braking Events Prevented</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-brand-cyan/10 to-transparent border-brand-cyan/20 text-white backdrop-blur-xl">
            <CardContent className="p-4 flex flex-col justify-center items-center text-center">
              <Zap className="w-6 h-6 text-brand-cyan mb-2" />
              <div className="text-3xl font-display font-bold">{activeAgents}</div>
              <div className="text-xs text-white/60 mt-1">Active AI Agents</div>
            </CardContent>
          </Card>
        </div>

        {/* Telemetry Console */}
        <Card className="flex-1 bg-[#090C10] border-white/10 text-white font-mono flex flex-col">
          <CardHeader className="py-3 border-b border-white/5 bg-white/5">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>System Telemetry</span>
              <span className="text-[10px] text-brand-cyan uppercase tracking-widest animate-pulse">Live</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-4 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#090C10] pointer-events-none z-10" />
            <div className="flex flex-col gap-2 h-full justify-start">
              <AnimatePresence>
                {logs.map((log, i) => (
                  <motion.div
                    key={log + i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1 - (i * 0.15), x: 0 }}
                    exit={{ opacity: 0 }}
                    className={`text-xs ${i === 0 ? 'text-brand-cyan' : 'text-white/60'}`}
                  >
                    <span className="text-white/30 mr-2">{'>'}</span>{log}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
};

export default LiveFlowTab;
