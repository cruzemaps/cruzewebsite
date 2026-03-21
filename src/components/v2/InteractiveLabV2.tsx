import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RefreshCw, Zap, Activity, Navigation, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface Vehicle {
    x: number;
    y: number;
    speed: number;
    targetSpeed: number;
    color: string;
    isPacing: boolean;
    lane: number;
}

const InteractiveLabV2 = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isPacingActive, setIsPacingActive] = useState(false);
    const [trafficFlow, setTrafficFlow] = useState(0);
    const [fuelSaved, setFuelSaved] = useState(0);
    const [stability, setStability] = useState(0);
    const [isJamming, setIsJamming] = useState(false);
    
    // V2 specific state
    const [savingsCounter, setSavingsCounter] = useState(12845920);

    const frameCountRef = useRef(0);
    const pacerRef = useRef(false);
    const pacingOffTimeRef = useRef<number | null>(null);

    useEffect(() => {
        if (pacerRef.current && !isPacingActive) {
            pacingOffTimeRef.current = Date.now();
        } else if (isPacingActive) {
            pacingOffTimeRef.current = null;
        }
        pacerRef.current = isPacingActive;
    }, [isPacingActive]);

    const vehiclesRef = useRef<Vehicle[]>([]);
    const requestRef = useRef<number>();

    const initVehicles = (width: number) => {
        const lanes = 3;
        const vehicleCount = 40;
        const vehicles: Vehicle[] = [];

        for (let i = 0; i < vehicleCount; i++) {
            const lane = i % lanes;
            vehicles.push({
                x: Math.random() * width,
                y: 50 + lane * 45,
                speed: 2 + Math.random() * 2,
                targetSpeed: 4,
                color: '#FF8C00', // brand orange
                isPacing: false,
                lane: lane,
            });
        }
        vehiclesRef.current = vehicles;
    };

    const update = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const vehicles = vehiclesRef.current;
        const width = canvas.width;
        const activePacing = pacerRef.current;

        vehicles.forEach((v, i) => {
            let closestAhead = null;
            let minDist = Infinity;

            vehicles.forEach((other, j) => {
                if (i === j || v.lane !== other.lane) return;
                let dist = other.x - v.x;
                if (dist < 0) dist += width;
                if (dist < minDist) {
                    minDist = dist;
                    closestAhead = other;
                }
            });

            const safeGap = 65;
            if (closestAhead && minDist < safeGap) {
                const targetMatch = (closestAhead as Vehicle).speed * 0.9;
                v.targetSpeed = Math.max(0.5, targetMatch * (minDist / safeGap));
            } else {
                const baseSpeed = 4;
                const jitter = (activePacing || isJamming) ? 0 : (Math.random() - 0.5) * 1.5;
                v.targetSpeed = baseSpeed + jitter;
            }

            if (isJamming) {
                v.targetSpeed *= 0.98;
                if (v.targetSpeed < 0.1) v.targetSpeed = 0;
            }

            v.speed += (v.targetSpeed - v.speed) * (activePacing ? 0.05 : 0.1);
            v.x = (v.x + v.speed) % width;
        });

        frameCountRef.current++;
        if (frameCountRef.current % 6 === 0) {
            const avgSpeed = vehicles.reduce((acc, v) => acc + v.speed, 0) / vehicles.length;
            const speedVariance = vehicles.reduce((acc, v) => acc + Math.abs(v.speed - avgSpeed), 0) / vehicles.length;

            let currentStability = Math.max(0, 100 - Math.round(speedVariance * 40));
            let currentFlow = Math.round(avgSpeed * 15);

            const isDecayPhase = pacingOffTimeRef.current && (Date.now() - pacingOffTimeRef.current < 5000);

            if (isJamming) {
                setStability(prev => Math.max(0, prev - 1.5 - Math.random()));
                setFuelSaved(prev => Math.max(0, prev - 0.2));
                setTrafficFlow(prev => Math.max(0, prev - 1));
            } else if (activePacing || isDecayPhase) {
                const crisisSensation = (100 - currentStability) / 50;
                if (crisisSensation > 0.2) {
                    currentStability += Math.round((Math.random() - 0.5) * 15 * crisisSensation);
                }

                if (isDecayPhase) {
                    setStability(prev => Math.max(40, prev - 1));
                    setFuelSaved(prev => Math.max(0, prev - 0.2));
                    setTrafficFlow(prev => prev + 0.12);
                } else {
                    setStability(Math.max(0, Math.min(100, currentStability)));
                    setTrafficFlow(Math.max(0, currentFlow));
                    const baseFuelTarget = (currentStability / 4.16);
                    setFuelSaved(prev => {
                        const next = prev + (baseFuelTarget - prev) * 0.1;
                        return Math.max(0, Math.min(30, next + (Math.random() - 0.5) * 0.4));
                    });
                    
                    // Update ROI counter while pacing is active
                    setSavingsCounter(prev => prev + 125.50);
                }
            } else {
                setStability(Math.max(0, Math.min(100, currentStability)));
                setTrafficFlow(Math.round(currentFlow));
            }
        }

        draw();
        requestRef.current = requestAnimationFrame(update);
    };

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const vehicles = vehiclesRef.current;
        const activePacing = pacerRef.current;

        ctx.clearRect(0, 0, width, height);

        // Grid/Radar Background effect for Dashboard feel
        ctx.strokeStyle = 'rgba(0, 242, 255, 0.03)';
        ctx.lineWidth = 1;
        for(let x=0; x<width; x+=40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
        for(let y=0; y<height; y+=40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }

        // Road markings
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;

        ctx.setLineDash([20, 30]);
        for (let i = 1; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(0, 35 + i * 45);
            ctx.lineTo(width, 35 + i * 45);
            ctx.stroke();
        }
        ctx.setLineDash([]);

        if (activePacing) {
            ctx.beginPath();
            ctx.lineWidth = 1.5;
            const thresholdSq = 140 * 140;
            for (let i = 0; i < vehicles.length; i++) {
                const v1 = vehicles[i];
                for (let j = i + 1; j < vehicles.length; j++) {
                    const v2 = vehicles[j];
                    const dx = v1.x - v2.x;
                    const dy = v1.y - v2.y;
                    if (dx * dx + dy * dy < thresholdSq) {
                        const alpha = 0.4 * (1 - (dx * dx + dy * dy) / thresholdSq);
                        ctx.strokeStyle = `rgba(0, 242, 255, ${alpha})`;
                        ctx.moveTo(v1.x + 12, v1.y);
                        ctx.lineTo(v2.x + 12, v2.y);
                    }
                }
            }
            ctx.stroke();
        }

        vehicles.forEach((v, index) => {
            const isBraking = v.targetSpeed < v.speed - 0.2;
            const isCruzeVehicle = index % 5 === 0;

            ctx.save();
            ctx.translate(v.x, v.y);

            // Floating +$ signs if active
            if (activePacing && isCruzeVehicle && Math.random() > 0.95) {
                ctx.fillStyle = '#00F2FF';
                ctx.font = '10px monospace';
                ctx.fillText('+$', 0, -15);
            }

            if (isCruzeVehicle) {
                ctx.fillStyle = activePacing ? '#00F2FF' : '#FF8C00';
                ctx.shadowBlur = activePacing ? 20 : 5;
                ctx.shadowColor = activePacing ? 'rgba(0, 242, 255, 0.8)' : 'rgba(255, 140, 0, 0.4)';
            } else {
                ctx.fillStyle = isBraking ? '#FF3333' : '#444C56';
                ctx.shadowBlur = isBraking ? 15 : 0;
                ctx.shadowColor = isBraking ? 'rgba(255, 51, 51, 0.6)' : 'transparent';
            }

            ctx.beginPath();
            ctx.roundRect(0, -7, 24, 14, 4);
            ctx.fill();

            // Cockpit
            ctx.fillStyle = 'rgba(11, 14, 20, 0.8)';
            ctx.roundRect(6, -5, 10, 10, 2);
            ctx.fill();

            ctx.restore();
        });
    };

    const injectJam = () => {
        setIsJamming(!isJamming);
        if (!isJamming) {
            vehiclesRef.current.forEach((v, idx) => {
                if (idx % 6 === 0) {
                    v.speed *= 0.1;
                    v.targetSpeed = 0;
                }
            });
        }
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.clientWidth;
                canvas.height = 240;
            }
            initVehicles(canvas.width);
            requestRef.current = requestAnimationFrame(update);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    return (
        <section className="py-24 bg-brand-charcoal relative overflow-hidden">
            <div className="container mx-auto px-6 max-w-6xl">
                
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
                        Cruze Lab
                    </h2>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-stretch">
                    
                    {/* Simulator Area: Mock Tablet / Dashboard */}
                    <div className="lg:w-2/3 bg-[#131821] rounded-3xl border border-white/10 p-2 shadow-2xl relative">
                        {/* Tablet Bezel */}
                        <div className="absolute top-0 inset-x-0 h-8 bg-black/40 rounded-t-3xl flex justify-center items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                           <div className="w-20 h-1.5 rounded-full bg-white/10"></div>
                        </div>
                        
                        <div className="mt-8 bg-[#0B0E14] rounded-2xl overflow-hidden relative border border-white/5">
                            
                            {/* Overlay HUD */}
                            <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none z-10">
                                <div className="space-y-1">
                                    <div className="text-xs font-bold text-brand-cyan tracking-widest uppercase flex items-center gap-2">
                                        <Navigation size={12} /> Active Network
                                    </div>
                                    <div className="text-sm font-display text-white/50 space-x-2">
                                        <span>LAT: 40.7128</span> <span>LONG: -74.0060</span>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border backdrop-blur-md ${isPacingActive ? 'bg-brand-cyan/20 text-brand-cyan border-brand-cyan/50' : isJamming ? 'bg-red-500/20 text-red-500 border-red-500/50' : 'bg-white/10 text-white/50 border-white/10'}`}>
                                    {isPacingActive ? 'AI Control Active' : isJamming ? 'Congestion Warning' : 'System Standby'}
                                </div>
                            </div>
                            
                            <canvas
                                ref={canvasRef}
                                className="w-full h-[240px] cursor-crosshair mix-blend-screen"
                                style={{ background: 'radial-gradient(circle at center, #131821 0%, #0B0E14 100%)' }}
                            />
                        </div>

                        {/* Controls Bottom Bar */}
                        <div className="px-6 py-4 flex items-center justify-between gap-4 mt-2 bg-black/20 rounded-2xl border border-white/5">
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => setIsPacingActive(!isPacingActive)}
                                    className={`rounded-full px-6 font-bold shadow-lg transition-all ${isPacingActive ? 'bg-brand-cyan/20 text-brand-cyan border-brand-cyan/50 hover:bg-brand-cyan/30' : 'bg-brand-orange text-[#0B0E14] hover:bg-brand-orange/90'}`}
                                >
                                    {isPacingActive ? <><Pause className="w-4 h-4 mr-2" /> Deactivate</> : <><Play className="w-4 h-4 mr-2" /> Activate Pacing</>}
                                </Button>
                                <Button
                                    onClick={injectJam}
                                    variant="outline"
                                    className={`rounded-full px-6 font-bold border-white/10 ${isJamming ? 'bg-red-500/20 text-red-500 border-red-500/50' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                                >
                                    {isJamming ? 'Clear Jam' : 'Simulate Jam'}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Business Case Sidebar */}
                    <div className="lg:w-1/3 flex flex-col gap-4">
                        <div className="bg-gradient-to-b from-[#131821] to-[#0B0E14] border border-white/10 rounded-3xl p-8 flex-1 flex flex-col justify-center">
                            
                            <div className="mb-8">
                                <h3 className="text-xl font-display font-medium text-white mb-2">Potential Annual Savings</h3>
                                <p className="text-sm font-body text-white/50">Calculated based on flow rate improvement and reduced idle time.</p>
                            </div>

                            {/* Odometer Counter */}
                            <div className="mb-10">
                                <div className="text-5xl lg:text-6xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-brand-orange tabular-nums">
                                    ${savingsCounter.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-white/60">System Stability</span>
                                        <span className="text-white font-mono">{stability}%</span>
                                    </div>
                                    <div className="h-2 bg-black rounded-full overflow-hidden border border-white/10">
                                        <div className="h-full bg-brand-cyan transition-all duration-300" style={{ width: `${stability}%` }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-white/60">Flow Throughput</span>
                                        <span className="text-white font-mono">{trafficFlow} v/m</span>
                                    </div>
                                    <div className="h-2 bg-black rounded-full overflow-hidden border border-white/10">
                                        <div className="h-full bg-brand-orange transition-all duration-300" style={{ width: `${(trafficFlow / 120) * 100}%` }} />
                                    </div>
                                </div>
                            </div>

                        </div>

                        <Button onClick={() => window.location.href='mailto:cruzemaps@gmail.com'} className="w-full py-6 rounded-2xl bg-white text-[#0B0E14] hover:bg-white/90 font-bold text-lg group">
                            Want these results? Talk to an Expert
                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default InteractiveLabV2;
