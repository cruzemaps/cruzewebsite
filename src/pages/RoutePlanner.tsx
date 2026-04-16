import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Navigation, TrendingUp, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import USAMap from "@/components/calculator/USAMap";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

type RegionKey = "southeast" | "northeast" | "southwest" | "midwest";

const REGION_METRICS = {
  southeast: {
    label: "Southeast",
    savingsRange: [9800, 11500],
    perMileRange: [0.098, 0.115],
    centsMile: "9.8¢ – 11.5¢",
  },
  northeast: {
    label: "Northeast",
    savingsRange: [8900, 10200],
    perMileRange: [0.089, 0.102],
    centsMile: "8.9¢ – 10.2¢",
  },
  southwest: {
    label: "Southwest",
    savingsRange: [7800, 9100],
    perMileRange: [0.078, 0.091],
    centsMile: "7.8¢ – 9.1¢",
  },
  midwest: {
    label: "Midwest / Mountain",
    savingsRange: [6500, 8200],
    perMileRange: [0.065, 0.082],
    centsMile: "6.5¢ – 8.2¢",
  },
};

const RoutePlanner = () => {
  const [region, setRegion] = useState<RegionKey>("southwest");
  const [distance, setDistance] = useState<number>(0);

  const currentMetrics = REGION_METRICS[region];

  const handleRouteSelected = (dist: number, domRegion: RegionKey) => {
    setDistance(dist);
    setRegion(domRegion);
  };

  // Generate chart data based on trips per year (10, 50, 100, 200, 500)
  const chartData = useMemo(() => {
    if (distance === 0) return [];
    
    const trips = [10, 50, 100, 200, 500];
    return trips.map(t => {
      const miles = distance * t;
      const savingsAvg = miles * ((currentMetrics.perMileRange[0] + currentMetrics.perMileRange[1]) / 2);
      return {
        trips: t.toString() + " Trips",
        Savings: Math.round(savingsAvg)
      };
    });
  }, [distance, currentMetrics]);

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white overflow-y-auto relative pb-20">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-brand-cyan/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-brand-orange/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 w-full p-6 border-b border-white/5 bg-[#0B0E14]/50 backdrop-blur-md flex items-center justify-between sticky top-0">
        <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium tracking-wide">Back to Dashboard</span>
        </Link>
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Cruze Logo" className="h-8 w-auto opacity-80" />
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 py-12 max-w-6xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-sm font-medium mb-6">
            <Navigation className="w-4 h-4" />
            Interactive Route Planner
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-4">
            Visualize Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-brand-cyan">Logistics Savings</span>
          </h1>
          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto">
            Click two states below to build a route profile. We'll instantly calculate the freight path and project your savings based on regional optimization logic.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Map Section */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col gap-4"
          >
            <div className="p-1 rounded-3xl bg-gradient-to-b from-white/10 to-transparent">
               <USAMap onRouteSelected={handleRouteSelected} />
            </div>
          </motion.div>

          {/* Results/Stats Section */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col justify-center space-y-6"
          >
            {distance === 0 ? (
              <Card className="bg-white/5 border-white/10 text-white backdrop-blur-xl h-full flex items-center justify-center min-h-[300px]">
                <div className="text-center p-8">
                  <Navigation className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/50">Please select a Start and End state on the map to begin.</p>
                </div>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-brand-cyan/10 to-transparent border border-brand-cyan/20 rounded-2xl p-6 backdrop-blur-xl">
                    <h4 className="text-brand-cyan/80 text-sm font-medium mb-2">Estimated Distance</h4>
                    <div className="text-4xl font-display font-bold text-white">
                      {distance.toLocaleString()} <span className="text-xl text-white/50">mi</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-brand-orange/10 to-transparent border border-brand-orange/20 rounded-2xl p-6 backdrop-blur-xl">
                    <h4 className="text-brand-orange/80 text-sm font-medium mb-2">Dominant Region</h4>
                    <div className="text-2xl font-display font-bold text-white mt-2">
                      {currentMetrics.label}
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <DollarSign className="w-24 h-24" />
                  </div>
                  <h4 className="text-white/50 text-sm font-medium mb-2">Projected Route Savings (100 Trips)</h4>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-4xl md:text-5xl font-display font-bold text-white tracking-tighter">
                      ${Math.round(distance * 100 * currentMetrics.perMileRange[0]).toLocaleString()}
                    </span>
                    <span className="text-xl text-white/50 font-light">—</span>
                    <span className="text-4xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-brand-cyan tracking-tighter">
                      ${Math.round(distance * 100 * currentMetrics.perMileRange[1]).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm text-brand-cyan">
                    <TrendingUp className="w-4 h-4" />
                    <span>Based on {currentMetrics.centsMile} / mile efficiency</span>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>

        {/* Graph Section */}
        {distance > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white/5 border-white/10 text-white backdrop-blur-xl overflow-hidden mt-8">
              <CardHeader>
                <CardTitle>Fleet Volume Projection</CardTitle>
                <CardDescription className="text-white/50">Estimated cumulative savings scaling with the number of trips taken on this specific route per year.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#00E5FF" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                      <XAxis dataKey="trips" stroke="#ffffff50" tick={{ fill: '#ffffff80' }} axisLine={false} />
                      <YAxis stroke="#ffffff50" tick={{ fill: '#ffffff80' }} tickFormatter={(val) => `$${val / 1000}k`} axisLine={false} tickLine={false} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#1A1F2B', borderColor: '#ffffff20', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#00E5FF', fontWeight: 'bold' }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, "Savings"]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="Savings" 
                        stroke="#00E5FF" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorSavings)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default RoutePlanner;
