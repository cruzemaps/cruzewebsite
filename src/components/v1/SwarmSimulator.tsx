import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RefreshCw, Zap, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Vehicle {
    x: number;
    y: number;
    speed: number;
    targetSpeed: number;
    color: string;
    isPacing: boolean;
    lane: number;
}

const SwarmSimulator = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isPacingActive, setIsPacingActive] = useState(false);
    const [trafficFlow, setTrafficFlow] = useState(0);
    const [fuelSaved, setFuelSaved] = useState(0);
    const [peakFuelSaved, setPeakFuelSaved] = useState(0);
    const [stability, setStability] = useState(0);
    const [isJamming, setIsJamming] = useState(false);

    const frameCountRef = useRef(0);
    const pacerRef = useRef(false);
    const pacingOffTimeRef = useRef<number | null>(null);

    // Keep pacerRef in sync and track when it turns off
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
        const vehicleCount = 45;
        const vehicles: Vehicle[] = [];

        for (let i = 0; i < vehicleCount; i++) {
            const lane = i % lanes; // Distributed lanes
            vehicles.push({
                x: Math.random() * width,
                y: 65 + lane * 40, // Centered in lanes
                speed: 2 + Math.random() * 2,
                targetSpeed: 4,
                color: '#FF6B00', // Premium Orange
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

        // Movement Logic
        vehicles.forEach((v, i) => {
            let closestAhead = null;
            let minDist = Infinity;

            vehicles.forEach((other, j) => {
                if (i === j || v.lane !== other.lane) return;
                let dist = other.x - v.x;
                if (dist < 0) dist += width; // Wrap around dist
                if (dist < minDist) {
                    minDist = dist;
                    closestAhead = other;
                }
            });

            // Improved Car Following
            const safeGap = 65;
            if (closestAhead && minDist < safeGap) {
                // Proportional braking
                const targetMatch = (closestAhead as Vehicle).speed * 0.9;
                v.targetSpeed = Math.max(0.5, targetMatch * (minDist / safeGap));
            } else {
                // Free flow
                const baseSpeed = 4;
                const jitter = (activePacing || isJamming) ? 0 : (Math.random() - 0.5) * 1.5;
                v.targetSpeed = baseSpeed + jitter;
            }

            // During jamming, cars slowly stop
            if (isJamming) {
                v.targetSpeed *= 0.98;
                if (v.targetSpeed < 0.1) v.targetSpeed = 0;
            }

            v.speed += (v.targetSpeed - v.speed) * (activePacing ? 0.05 : 0.1);
            v.x = (v.x + v.speed) % width;
        });

        // UI State Updates
        frameCountRef.current++;
        if (frameCountRef.current % 6 === 0) {
            const avgSpeed = vehicles.reduce((acc, v) => acc + v.speed, 0) / vehicles.length;
            const speedVariance = vehicles.reduce((acc, v) => acc + Math.abs(v.speed - avgSpeed), 0) / vehicles.length;

            let currentStability = Math.max(0, 100 - Math.round(speedVariance * 40));
            let currentFlow = Math.round(avgSpeed * 15);

            const isDecayPhase = pacingOffTimeRef.current && (Date.now() - pacingOffTimeRef.current < 5000);

            if (isJamming) {
                // Slow decay to zero
                setStability(prev => Math.max(0, prev - 1.5 - Math.random()));
                setFuelSaved(prev => Math.max(0, prev - 0.2));
                setTrafficFlow(prev => Math.max(0, prev - 1));
            } else if (activePacing || isDecayPhase) {
                // Fluctuations especially when unstable or jamming
                const crisisSensation = (100 - currentStability) / 50;
                if (crisisSensation > 0.2) {
                    currentStability += Math.round((Math.random() - 0.5) * 15 * crisisSensation);
                }

                if (isDecayPhase) {
                    // Gradual decay after pacing off
                    setStability(prev => Math.max(40, prev - 1));
                    setFuelSaved(prev => Math.max(0, prev - 0.2));
                    // Flow rate increase by 1 vehicle for 5s
                    setTrafficFlow(prev => prev + 0.12); // ~1 unit over 30 UI updates
                } else {
                    // Active Pacing Normal Update
                    setStability(Math.max(0, Math.min(100, currentStability)));
                    setTrafficFlow(Math.max(0, currentFlow));
                    const baseFuelTarget = (currentStability / 4.16);
                    setFuelSaved(prev => {
                        const next = prev + (baseFuelTarget - prev) * 0.1;
                        const clamped = Math.max(0, Math.min(30, next + (Math.random() - 0.5) * 0.4));
                        if (clamped > peakFuelSaved) setPeakFuelSaved(clamped);
                        return clamped;
                    });
                }
            } else {
                // Normal unpaced state
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

        ctx.fillStyle = '#0f1115';
        ctx.fillRect(0, 0, width, height);

        // Road markings
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 45); ctx.lineTo(width, 45);
        ctx.moveTo(0, 165); ctx.lineTo(width, 165);
        ctx.stroke();

        ctx.setLineDash([30, 40]);
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        for (let i = 1; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(0, 45 + i * 40);
            ctx.lineTo(width, 45 + i * 40);
            ctx.stroke();
        }
        ctx.setLineDash([]);

        if (activePacing) {
            ctx.beginPath();
            ctx.lineWidth = 1;
            const thresholdSq = 120 * 120;
            for (let i = 0; i < vehicles.length; i++) {
                const v1 = vehicles[i];
                for (let j = i + 1; j < vehicles.length; j++) {
                    const v2 = vehicles[j];
                    const dx = v1.x - v2.x;
                    const dy = v1.y - v2.y;
                    if (dx * dx + dy * dy < thresholdSq) {
                        const alpha = 0.15 * (1 - (dx * dx + dy * dy) / thresholdSq);
                        ctx.strokeStyle = `rgba(255, 107, 0, ${alpha})`;
                        ctx.moveTo(v1.x + 12, v1.y);
                        ctx.lineTo(v2.x + 12, v2.y);
                    }
                }
            }
            ctx.stroke();
        }

        vehicles.forEach((v) => {
            const isBraking = v.targetSpeed < v.speed - 0.2;
            ctx.save();
            ctx.translate(v.x, v.y);

            // Car Body (Premium Orange)
            ctx.fillStyle = '#FF6B00';
            ctx.shadowBlur = activePacing ? 15 : 5;
            ctx.shadowColor = activePacing ? 'rgba(255, 107, 0, 0.6)' : 'rgba(255, 107, 0, 0.2)';

            ctx.beginPath();
            ctx.roundRect(0, -7, 24, 14, 4);
            ctx.fill();

            // Cockpit
            ctx.fillStyle = 'rgba(15, 20, 30, 0.6)';
            ctx.roundRect(6, -5, 10, 10, 1.5);
            ctx.fill();

            // Lights
            ctx.fillStyle = 'rgba(255, 255, 240, 0.9)';
            ctx.fillRect(22, -6, 3, 3);
            ctx.fillRect(22, 3, 3, 3);

            if (isBraking) {
                ctx.fillStyle = '#ff0000';
                ctx.shadowBlur = 12;
                ctx.shadowColor = '#ff0000';
            } else {
                ctx.fillStyle = '#880000';
                ctx.shadowBlur = 0;
            }
            ctx.fillRect(-1, -6, 2, 3);
            ctx.fillRect(-1, 3, 2, 3);

            ctx.restore();
        });
    };

    const injectJam = () => {
        setIsJamming(!isJamming);

        if (!isJamming) {
            // Only affect vehicles when turning ON the jam
            vehiclesRef.current.forEach((v, idx) => {
                if (idx % 8 === 0) {
                    v.speed *= 0.1;
                    v.targetSpeed = 0;
                }
            });
        }
    };

    const resetSimulation = () => {
        setStability(0);
        setTrafficFlow(0);
        setFuelSaved(0);
        setPeakFuelSaved(0);
        setIsJamming(false);
        setIsPacingActive(false);
        pacingOffTimeRef.current = null;
        initVehicles(canvasRef.current?.width || 800);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.width = canvas.parentElement?.clientWidth || 800;
            canvas.height = 200;
            initVehicles(canvas.width);
            requestRef.current = requestAnimationFrame(update);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []); // Run ONLY once on mount


    return (
        <section id="simulator" className="py-24 bg-background/50 border-y border-border/50">
            <div className="container mx-auto px-6">
                <div className="flex flex-col lg:flex-row gap-12 items-center">
                    <div className="lg:w-1/2">
                        <div className="inline-flex items-center space-x-2 text-primary text-sm font-bold tracking-widest uppercase mb-4">
                            <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                            <span>Live Lab</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Interactive <span className="text-primary italic">Swarm Lab</span>
                        </h2>
                        <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                            Experience swarm intelligence in action. Toggle Cruze Pacing to see how
                            a tiny percentage of active vehicles can dissolve massive shockwaves and restore flow.
                        </p>

                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                            <div className="bg-card/30 border border-border/50 p-6 rounded-2xl backdrop-blur-sm group hover:border-primary/30 transition-all duration-300">
                                <div className="flex items-center space-x-3 mb-2 text-muted-foreground">
                                    <Activity className="w-4 h-4" />
                                    <span className="text-xs font-semibold uppercase tracking-wider">Flow Rate</span>
                                </div>
                                <div className="flex items-baseline space-x-1">
                                    <span className="text-2xl font-bold">{trafficFlow}</span>
                                    <span className="text-muted-foreground text-sm">v/m</span>
                                </div>
                            </div>

                            <div className="bg-card/30 border border-border/50 p-6 rounded-2xl backdrop-blur-sm group hover:border-primary/30 transition-all duration-300 relative overflow-hidden">
                                <div className="flex items-center space-x-3 mb-2 text-muted-foreground">
                                    <Zap className="w-4 h-4" />
                                    <span className="text-xs font-semibold uppercase tracking-wider">Fuel Saved</span>
                                </div>
                                <div className="flex items-baseline space-x-2">
                                    <span className="text-xs text-muted-foreground">{fuelSaved.toFixed(1)}%</span>
                                    <span className="text-2xl font-bold text-primary">+{fuelSaved.toFixed(1)}%</span>
                                </div>
                                <div className="mt-1 text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                                    Peak: {peakFuelSaved.toFixed(1)}%
                                </div>
                            </div>

                            <div className="bg-card/30 border border-border/50 p-6 rounded-2xl backdrop-blur-sm group hover:border-primary/30 transition-all duration-300">
                                <div className="flex items-center space-x-3 mb-2 text-muted-foreground">
                                    <span className={`w-2 h-2 rounded-full ${stability > 80 ? 'bg-green-500' : stability > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                                    <span className="text-xs font-semibold uppercase tracking-wider">Stability</span>
                                </div>
                                <div className="flex items-baseline space-x-1">
                                    <span className="text-2xl font-bold">{stability}%</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            {stability === 0 && trafficFlow === 0 && fuelSaved === 0 ? (
                                <Button
                                    size="lg"
                                    className="h-14 px-12 rounded-2xl text-lg font-bold bg-primary text-background hover:scale-105 shadow-xl shadow-primary/30 transition-all duration-300 animate-bounce"
                                    onClick={resetSimulation}
                                >
                                    <RefreshCw className="w-6 h-6 mr-2" />
                                    Reset Simulation Lab
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        size="lg"
                                        className={`h-14 px-8 rounded-2xl text-lg font-bold shadow-lg transition-all duration-500 transform active:scale-95 ${isPacingActive
                                            ? 'bg-primary/20 text-primary border-2 border-primary/50 hover:bg-primary/30'
                                            : 'bg-primary hover:bg-primary/90 text-background hover:scale-[1.02] shadow-primary/25'
                                            }`}
                                        onClick={() => setIsPacingActive(!isPacingActive)}
                                    >
                                        {isPacingActive ? (
                                            <>
                                                <Pause className="w-6 h-6 mr-2 fill-current" />
                                                Pacing Active
                                            </>
                                        ) : (
                                            <>
                                                <Play className="w-6 h-6 mr-2 fill-current" />
                                                Activate Pacing
                                            </>
                                        )}
                                    </Button>

                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className={`h-14 px-8 rounded-2xl text-lg font-bold border-2 transition-all duration-300 ${isJamming
                                            ? 'bg-red-500/20 border-red-500 text-red-500 hover:bg-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse'
                                            : 'border-border/50 hover:border-primary/50 hover:bg-primary/5 shadow-sm'
                                            }`}
                                        onClick={injectJam}
                                    >
                                        {isJamming ? 'Clear Phantom Jam' : 'Inject Phantom Jam'}
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-14 w-14 rounded-2xl border border-border/50 hover:border-primary/50 hover:bg-primary/5"
                                        onClick={resetSimulation}
                                    >
                                        <RefreshCw className="w-6 h-6 text-muted-foreground" />
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="lg:w-1/2 w-full">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-orange-500/20 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
                            <div className="relative bg-[#0f1115] rounded-[2rem] p-4 border border-border/50 shadow-2xl overflow-hidden">
                                <div className="flex items-center justify-between mb-4 px-4">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Swarm Coordination View</span>
                                    <div className="flex items-center space-x-2">
                                        <span className={`w-1.5 h-1.5 rounded-full ${stability < 30 ? 'bg-red-500 animate-ping' : 'bg-primary'}`}></span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">
                                            {isJamming || stability < 30 ? 'Shockwaves Detected' : stability < 80 ? 'Stabilizing Flow' : 'Flow Equalized'}
                                        </span>
                                    </div>
                                </div>
                                <canvas
                                    ref={canvasRef}
                                    className="w-full h-[200px] cursor-crosshair"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SwarmSimulator;
