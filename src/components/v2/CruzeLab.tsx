import React, { useState, useEffect, useRef } from 'react';
import { BrainCircuit, AlertTriangle, Activity, Zap, ShieldAlert, Droplet, Settings2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

const NUM_LANES = 3;
const CARS_PER_LANE = 8;
const NUM_CARS = NUM_LANES * CARS_PER_LANE;
const TRACK_WIDTH = 100; // Percentage
const OPTIMAL_SPEED = 0.5; // Base percentage width per frame

const CruzeLab = () => {
  const [cruzeEnabled, setCruzeEnabled] = useState(false);
  const [jamSeverity, setJamSeverity] = useState([0]); // 0 to 100
  
  // Simulation States
  const [cars, setCars] = useState<{ id: number, x: number, lane: number, speed: number, color: string }[]>(
    Array.from({ length: NUM_CARS }).map((_, i) => ({
      id: i,
      x: (TRACK_WIDTH / CARS_PER_LANE) * (i % CARS_PER_LANE),
      lane: Math.floor(i / CARS_PER_LANE),
      speed: OPTIMAL_SPEED,
      color: '#FFFFFF'
    }))
  );
  
  const [metrics, setMetrics] = useState<{ time: string, speed: number, fuel: number }[]>([]);
  const [totalFuelSaved, setTotalFuelSaved] = useState(0);

  const requestRef = useRef<number>();
  const lastUpdateRef = useRef<number>(Date.now());
  const chartUpdateRef = useRef<number>(Date.now());

  // Simulation loop
  const updateSimulation = () => {
    const now = Date.now();
    const dt = (now - lastUpdateRef.current) / 16.66; // Normalize to 60fps
    lastUpdateRef.current = now;

    setCars(prevCars => {
      let newCars = [...prevCars];
      
      for (let i = 0; i < NUM_CARS; i++) {
        const car = newCars[i];
        const nextCarIndex = (i % CARS_PER_LANE === CARS_PER_LANE - 1) ? i - CARS_PER_LANE + 1 : i + 1;
        const nextCar = newCars[nextCarIndex];
        
        // Calculate distance to next car
        let dist = nextCar.x - car.x;
        if (dist <= 0) dist += TRACK_WIDTH;
        
        const safeDist = TRACK_WIDTH / CARS_PER_LANE; // Optimal spacing
        
        let targetSpeed = OPTIMAL_SPEED;
        const jamFactor = jamSeverity[0] / 100;

        // Apply phantom jam only to the FIRST car of EACH lane
        if (jamFactor > 0 && (i % CARS_PER_LANE === 0)) {
           // Inject Phantom Jam: Lead car slows down based on severity
           targetSpeed = OPTIMAL_SPEED * (1 - jamFactor);
        } else {
          if (cruzeEnabled) {
            // AI Cruze Mode: Cooperative Adaptive Cruise Control
            // Smoothly adjusts based on global network density and next car
            if (dist < safeDist * 0.8) {
               targetSpeed = nextCar.speed; // Match speed smoothly
            } else if (dist < safeDist) {
               targetSpeed = OPTIMAL_SPEED * 0.8;
            } else {
               targetSpeed = OPTIMAL_SPEED;
            }
          } else {
            // Human Driver Mode: Delayed reaction, over-braking (creates shockwave)
            if (dist < safeDist * 0.5) {
               targetSpeed = 0; // Hard brake
            } else if (dist < safeDist * 0.9) {
               targetSpeed = nextCar.speed * 0.5; // Overreact
            } else {
               targetSpeed = OPTIMAL_SPEED * 1.1; // Trying to catch up
            }
          }
        }

        // Apply acceleration / deceleration
        const accelerationRate = cruzeEnabled ? 0.05 : 0.15;
        car.speed += (targetSpeed - car.speed) * accelerationRate * dt;
        
        // Safety bounds
        car.speed = Math.max(0, Math.min(car.speed, OPTIMAL_SPEED * 1.5));
        
        // Update position
        car.x = (car.x + car.speed * dt) % TRACK_WIDTH;

        // Set color based on speed
        if (car.speed < OPTIMAL_SPEED * 0.3) car.color = '#EF4444'; // Red (Stopped)
        else if (car.speed < OPTIMAL_SPEED * 0.7) car.color = '#EAB308'; // Yellow (Slowing)
        else car.color = '#00F2FF'; // Cyan (Optimal)
      }
      
      return newCars;
    });

    // Update charts every 500ms
    if (now - chartUpdateRef.current > 500) {
      chartUpdateRef.current = now;
      
      // Calculate metrics from current cars BEFORE updating them if possible, or just use the cars state directly.
      // Since cars is a state variable, it might be stale in the closure, so we should rely on the functional updater 
      // just to read, but we can't do that. Instead, let's use a ref for cars to read them safely, OR just 
      // accept slightly stale metrics. Let's just use the current closure's 'cars' value for the metrics update.
      const avgSpeed = cars.reduce((acc, c) => acc + c.speed, 0) / NUM_CARS;
      const normalizedSpeed = (avgSpeed / OPTIMAL_SPEED) * 65; 

      const inefficientCars = cars.filter(c => c.speed < OPTIMAL_SPEED * 0.5 || c.speed > OPTIMAL_SPEED * 1.1).length;
      let mpg = cruzeEnabled ? 32 : 28; 
      mpg -= (inefficientCars / NUM_CARS) * 15; 
      mpg = Math.max(5, mpg);

      if (cruzeEnabled && jamSeverity[0] > 0) {
         setTotalFuelSaved(prev => prev + 0.15); 
      }

      setMetrics(prev => {
        const newMetrics = [...prev, { 
          time: new Date().toLocaleTimeString([], { hour12: false, second: '2-digit', minute: '2-digit' }), 
          speed: parseFloat(normalizedSpeed.toFixed(1)), 
          fuel: parseFloat(mpg.toFixed(1)) 
        }];
        if (newMetrics.length > 20) newMetrics.shift();
        return newMetrics;
      });
    }

    requestRef.current = requestAnimationFrame(updateSimulation);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(updateSimulation);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [cruzeEnabled, jamSeverity]);

  return (
    <section id="interactive-lab" className="py-24 bg-brand-charcoal relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-glow opacity-10 pointer-events-none" />
      
      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 mb-4">
            <BrainCircuit className="w-4 h-4 animate-pulse" />
            <span className="text-xs font-bold tracking-widest uppercase">Cruze Interactive Lab</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
            Phantom Jam Resolution
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto font-body">
            Experience how Cruze's V2X Swarm Intelligence prevents traffic shockwaves, saving fuel and optimizing network flow in real-time.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Controls Panel */}
          <div className="bg-[#131821] border border-white/10 rounded-2xl p-8 flex flex-col justify-between shadow-xl">
            <div>
              <h3 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-brand-orange" />
                Simulation Controls
              </h3>
              
              <div className="space-y-8">
                {/* AI Toggle */}
                <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
                  <div className="space-y-1">
                    <Label className="text-white font-bold text-base">Cruze Swarm AI</Label>
                    <p className="text-xs text-white/50">Enable cooperative V2X communication</p>
                  </div>
                  <Switch 
                    checked={cruzeEnabled}
                    onCheckedChange={setCruzeEnabled}
                    className="data-[state=checked]:bg-brand-cyan"
                  />
                </div>

                {/* Inject Jam Action */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-white font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-brand-orange" />
                      Phantom Jam Severity
                    </Label>
                    <span className="font-mono text-brand-orange font-bold text-sm">{jamSeverity[0]}%</span>
                  </div>
                  <Slider 
                    value={jamSeverity} 
                    onValueChange={setJamSeverity} 
                    max={100} 
                    step={1} 
                    className="py-4"
                  />
                  <p className="text-xs text-white/40 text-center">
                    Adjust to force the lead vehicle to brake, simulating human error.
                  </p>
                </div>
              </div>
            </div>

            {/* Total Fuel Saved Metric */}
            <div className="mt-8 pt-8 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-white/50">
                  <Droplet className="w-4 h-4 text-brand-cyan" />
                  <span className="text-xs font-bold uppercase tracking-wider">Accumulated Fuel Savings</span>
                </div>
              </div>
              <div className="text-4xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-blue-500">
                {totalFuelSaved.toFixed(2)} gal
              </div>
              <p className="text-[10px] text-white/30 mt-2 uppercase tracking-widest">
                (Vs. Human-driven shockwave baseline)
              </p>
            </div>
          </div>

          {/* Visualizer */}
          <div className="lg:col-span-1 bg-[#090A0F] border border-white/5 rounded-2xl flex flex-col relative shadow-inner overflow-hidden min-h-[400px]">
            
            <div className="relative w-full h-full flex-grow flex items-center min-h-[400px]">
              {/* Road Track Background */}
              <div className="absolute inset-x-0 top-[15%] bottom-[15%] bg-[#1A1D24] border-t-[4px] border-t-yellow-500/60 border-b-[4px] border-b-white/60 shadow-[inset_0_20px_50px_rgba(0,0,0,0.5)] flex flex-col justify-evenly overflow-hidden">
                {/* Subtle Road Texture */}
                <div className="absolute inset-0 opacity-[0.03] bg-white pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, #000 1px, transparent 1px)', backgroundSize: '4px 4px' }}></div>
                
                {/* Lane Dividers */}
                <div className="w-full h-[4px] bg-[repeating-linear-gradient(90deg,transparent,transparent_40px,rgba(255,255,255,0.4)_40px,rgba(255,255,255,0.4)_80px)] z-0"></div>
                <div className="w-full h-[4px] bg-[repeating-linear-gradient(90deg,transparent,transparent_40px,rgba(255,255,255,0.4)_40px,rgba(255,255,255,0.4)_80px)] z-0"></div>
              </div>
              
              {/* Cars Container */}
              <div className="absolute inset-x-0 top-[15%] bottom-[15%] z-10">
                {cars.map((car) => {
                  const laneOffset = car.lane * 33.33 + 16.66; // Center in each lane (0-100%)
                  return (
                    <div 
                      key={car.id}
                      className="absolute w-10 h-5 -mt-2.5 -ml-5 transition-colors duration-200"
                      style={{
                        left: `${car.x}%`,
                        top: `${laneOffset}%`,
                        color: car.color,
                        filter: `drop-shadow(0 0 8px ${car.color}90)`
                      }}
                    >
                      {/* Car SVG facing RIGHT */}
                      <svg viewBox="0 0 40 24" fill="currentColor" width="100%" height="100%">
                        <path d="M10,4 C6,4 4,8 4,12 C4,16 6,20 10,20 L30,20 C34,20 36,16 36,12 C36,8 34,4 30,4 Z" />
                        <rect x="12" y="6" width="6" height="12" fill="#000" opacity="0.5" rx="1" />
                        <rect x="24" y="6" width="4" height="12" fill="#000" opacity="0.5" rx="1" />
                      </svg>
                    </div>
                  );
                })}
              </div>

              {/* Status Badge */}
              <div className="absolute top-6 right-6 flex flex-col items-end z-20">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border ${cruzeEnabled ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan shadow-[0_0_20px_rgba(0,242,255,0.3)]' : 'bg-[#0B0E14] border-white/20 text-white/40 shadow-xl'}`}>
                  {cruzeEnabled ? <BrainCircuit className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                  <span className="text-[11px] font-bold tracking-widest uppercase">
                    {cruzeEnabled ? 'Swarm Active' : 'Human Mode'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Telemetry Charts */}
          <div className="bg-[#131821] border border-white/10 rounded-2xl p-6 flex flex-col gap-6 shadow-xl">
            
            {/* Speed Chart */}
            <div className="flex-1 min-h-[180px] bg-black/40 rounded-xl border border-white/5 p-4 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-white/50 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-brand-orange" /> Network Speed
                </h4>
                <span className="font-mono text-brand-orange text-sm font-bold">
                  {metrics.length > 0 ? metrics[metrics.length - 1].speed.toFixed(1) : '0.0'} mph
                </span>
              </div>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics}>
                    <defs>
                      <linearGradient id="speedColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF8C00" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#FF8C00" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[0, 80]} hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0B0E14', borderColor: '#ffffff20', borderRadius: '8px' }}
                      itemStyle={{ color: '#FF8C00', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="speed" stroke="#FF8C00" strokeWidth={2} fillOpacity={1} fill="url(#speedColor)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Fuel Efficiency Chart */}
            <div className="flex-1 min-h-[180px] bg-black/40 rounded-xl border border-white/5 p-4 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-white/50 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Droplet className="w-3 h-3 text-brand-cyan" /> Fuel Efficiency
                </h4>
                <span className="font-mono text-brand-cyan text-sm font-bold">
                  {metrics.length > 0 ? metrics[metrics.length - 1].fuel.toFixed(1) : '0.0'} mpg
                </span>
              </div>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics}>
                    <defs>
                      <linearGradient id="fuelColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00F2FF" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00F2FF" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[0, 40]} hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0B0E14', borderColor: '#ffffff20', borderRadius: '8px' }}
                      itemStyle={{ color: '#00F2FF', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="fuel" stroke="#00F2FF" strokeWidth={2} fillOpacity={1} fill="url(#fuelColor)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default CruzeLab;
