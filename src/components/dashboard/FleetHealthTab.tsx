import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Leaf, Award, CarFront, TreePine } from "lucide-react";
import { motion } from "framer-motion";

const COMPLIANCE_DATA = [
  { name: "Optimal Pacing", value: 78, color: "#00E5FF" },
  { name: "Minor Deviations", value: 16, color: "#FF6B00" },
  { name: "Non-Compliant", value: 6, color: "#4A5568" },
];

const FleetHealthTab = () => {
  return (
    <div className="flex flex-col gap-6">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Driver Compliance */}
        <Card className="bg-white/5 border-white/10 text-white backdrop-blur-xl">
          <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Award className="w-5 h-5 text-brand-orange" /> Hardware-Free Compliance
             </CardTitle>
             <CardDescription className="text-white/50">Driver adherence to Cruze Agent pacing speeds via cell network.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-[250px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={COMPLIANCE_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {COMPLIANCE_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1F2B', borderColor: '#ffffff20', color: '#fff', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-display font-bold text-white">94<span className="text-xl text-white/50">%</span></span>
                <span className="text-[10px] uppercase tracking-widest text-white/40">Acceptable</span>
              </div>
            </div>
            
            <div className="w-full mt-4 grid grid-cols-3 gap-2 text-center text-sm">
               {COMPLIANCE_DATA.map(d => (
                 <div key={d.name} className="bg-white/5 rounded-lg p-2 flex flex-col items-center justify-center border border-white/5">
                   <div className="w-2 h-2 rounded-full mb-1" style={{ backgroundColor: d.color }} />
                   <span className="text-xs text-white/70">{d.name}</span>
                   <span className="font-bold">{d.value}%</span>
                 </div>
               ))}
            </div>
          </CardContent>
        </Card>

        {/* ESG / Green Score */}
        <Card className="bg-gradient-to-tr from-green-900/20 via-[#1A1F2B] to-brand-cyan/10 border-white/10 text-white backdrop-blur-xl flex flex-col">
          <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Leaf className="w-5 h-5 text-green-400" /> Executive ESG Reporting
             </CardTitle>
             <CardDescription className="text-white/50">Environmental footprint reduction due to shockwave dissolution.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col justify-center flex-1 space-y-8">
            
            <div className="text-center">
               <div className="text-xs text-white/50 uppercase tracking-widest mb-2">Total CO₂ Tonnage Prevented</div>
               <div className="text-6xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-brand-cyan">
                 2,408.5
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                 <CarFront className="w-8 h-8 text-white/30 mb-2" />
                 <span className="text-2xl font-bold">520</span>
                 <span className="text-xs text-white/50">Equivalent Cars Removed</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                 <TreePine className="w-8 h-8 text-green-400/50 mb-2" />
                 <span className="text-2xl font-bold">39,400</span>
                 <span className="text-xs text-white/50">Trees Planted Equivalent</span>
              </div>
            </div>

          </CardContent>
        </Card>

      </div>

    </div>
  );
};

export default FleetHealthTab;
