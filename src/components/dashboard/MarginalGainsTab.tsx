import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { DollarSign, Clock, Droplet } from "lucide-react";
import { motion } from "framer-motion";

const MONTHLY_DATA = [
  { name: "Jan", fuelSavings: 42000, timeSavings: 38000 },
  { name: "Feb", fuelSavings: 48000, timeSavings: 41000 },
  { name: "Mar", fuelSavings: 56000, timeSavings: 49000 },
  { name: "Apr", fuelSavings: 72000, timeSavings: 68000 },
  { name: "May", fuelSavings: 91000, timeSavings: 85000 },
  { name: "Jun", fuelSavings: 114000, timeSavings: 106000 },
];

const MarginalGainsTab = () => {
  const [cumulativeROI, setCumulativeROI] = useState(892450);

  // Fake intervals removed to shift toward static projection framing

  return (
    <div className="flex flex-col gap-6">
      
      {/* Top Value Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2 bg-gradient-to-br from-brand-orange/20 to-brand-cyan/20 border-white/10 text-white backdrop-blur-xl relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <DollarSign className="w-32 h-32" />
          </div>
          <CardHeader>
            <CardDescription className="text-white/70 text-base">Cumulative Network ROI</CardDescription>
            <CardTitle className="text-5xl md:text-7xl font-display font-bold tracking-tighter">
              ${cumulativeROI.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </CardTitle>
          </CardHeader>
        </Card>

        <div className="flex flex-col gap-4">
           <Card className="bg-white/5 border-white/10 text-white flex-1">
             <CardContent className="p-6 flex items-center justify-between h-full">
                <div>
                  <div className="text-xs text-white/50 mb-1">Fuel Economy Gained</div>
                  <div className="text-2xl font-bold flex items-center gap-2 text-brand-orange">
                    $423.5k
                  </div>
                </div>
                <Droplet className="w-8 h-8 text-brand-orange/50" />
             </CardContent>
           </Card>
           
           <Card className="bg-white/5 border-white/10 text-white flex-1">
             <CardContent className="p-6 flex items-center justify-between h-full">
                <div>
                  <div className="text-xs text-white/50 mb-1">Driver Hours Saved</div>
                  <div className="text-2xl font-bold flex items-center gap-2 text-brand-cyan">
                    $468.9k
                  </div>
                </div>
                <Clock className="w-8 h-8 text-brand-cyan/50" />
             </CardContent>
           </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Fuel vs Time Breakdown Chart */}
        <Card className="lg:col-span-2 bg-white/5 border-white/10 text-white">
          <CardHeader>
            <CardTitle>Savings Vector Breakdown</CardTitle>
            <CardDescription className="text-white/50">Tracking operational velocity constraints vs idle reduction</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MONTHLY_DATA} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                  <XAxis dataKey="name" stroke="#ffffff50" axisLine={false} tickLine={false} />
                  <YAxis stroke="#ffffff50" tickFormatter={(val) => `$${val/1000}k`} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: '#ffffff05'}}
                    contentStyle={{ backgroundColor: '#1A1F2B', borderColor: '#ffffff20', color: '#fff', borderRadius: '8px' }}
                    formatter={(val: number) => [`$${val.toLocaleString()}`, undefined]}
                  />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  <Bar dataKey="fuelSavings" name="Fuel Saved" stackId="a" fill="#FF6B00" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="timeSavings" name="Time Saved" stackId="a" fill="#00E5FF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pilot Milestone Tracker */}
        <Card className="bg-white/5 border-white/10 text-white flex flex-col">
          <CardHeader>
            <CardTitle>Deployment Progress</CardTitle>
            <CardDescription className="text-white/50">Active pilot expansion targets</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-8 flex flex-col justify-center pb-8">
            
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <div>
                  <h4 className="font-medium text-sm text-brand-orange">I-80 Corridor (CA)</h4>
                  <span className="text-xs text-white/50">Phase 2 AI Tuning</span>
                </div>
                <span className="text-brand-orange font-mono font-bold text-lg">68%</span>
              </div>
              <Progress value={68} className="h-2 bg-white/10" indicatorColor="bg-brand-orange" />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <div>
                  <h4 className="font-medium text-sm text-brand-cyan">H-E-B Supply Chain (TX)</h4>
                  <span className="text-xs text-white/50">Initial Hardware-Free Rollout</span>
                </div>
                <span className="text-brand-cyan font-mono font-bold text-lg">34%</span>
              </div>
              <Progress value={34} className="h-2 bg-white/10" indicatorColor="bg-brand-cyan" />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <div>
                  <h4 className="font-medium text-sm text-white/80">FedEx Regional (Midwest)</h4>
                  <span className="text-xs text-white/50">Negotiation / Setup</span>
                </div>
                <span className="text-white/80 font-mono font-bold text-lg">12%</span>
              </div>
              <Progress value={12} className="h-2 bg-white/10" indicatorColor="bg-white" />
            </div>

          </CardContent>
        </Card>

      </div>

    </div>
  );
};

export default MarginalGainsTab;
