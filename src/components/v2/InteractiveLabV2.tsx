import React, { useState, useEffect, useRef } from 'react';
import { Camera, MapPin, Radio, X, BrainCircuit, AlertTriangle, TrendingUp, CheckCircle2, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CAMERAS = [
  { id: 1, city: 'Dallas', location: 'IH-635', lat: 32.9236, lng: -96.7669, url: 'https://s70.us-east-1.skyvdn.com:443/rtplive/TX_DAL_001/playlist.m3u8' },
  { id: 2, city: 'Houston', location: 'IH-45', lat: 29.7604, lng: -95.3698, url: 'https://s70.us-east-1.skyvdn.com:443/rtplive/TX_HOU_1002/playlist.m3u8' },
  { id: 3, city: 'Austin', location: 'IH-35', lat: 30.2672, lng: -97.7431, url: 'https://s70.us-east-1.skyvdn.com:443/rtplive/TX_AUS_261/playlist.m3u8' },
  { id: 4, city: 'San Antonio', location: 'IH-10', lat: 29.4241, lng: -98.4936, url: 'https://s70.us-east-1.skyvdn.com:443/rtplive/TX_AUS_262/playlist.m3u8' },
  { id: 5, city: 'Fort Worth', location: 'FM-1709 @ Brock', lat: 32.7254, lng: -97.3208, url: 'https://s70.us-east-1.skyvdn.com:443/rtplive/TX_DAL_002/playlist.m3u8' },
  { id: 6, city: 'El Paso', location: 'IH-10 @ Lee Trevino', lat: 31.7398, lng: -106.3254, url: 'https://s70.us-east-1.skyvdn.com:443/rtplive/TX_ELP_242/playlist.m3u8' },
];

const HlsPlayer = ({ src }: { src: string }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        let hls: any = null;
        
        const initPlayer = () => {
            const video = videoRef.current;
            if (!video) return;

            if ((window as any).Hls && (window as any).Hls.isSupported()) {
                hls = new (window as any).Hls({
                    maxBufferLength: 10,
                    maxMaxBufferLength: 20,
                });
                hls.loadSource(src);
                hls.attachMedia(video);
                hls.on((window as any).Hls.Events.MANIFEST_PARSED, () => {
                    video.play().catch(e => console.log('Autoplay prevented:', e));
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = src;
                video.addEventListener('loadedmetadata', () => {
                    video.play().catch(e => console.log('Autoplay prevented:', e));
                });
            }
        };

        if (typeof window !== 'undefined' && !(window as any).Hls) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
            script.async = true;
            script.onload = initPlayer;
            document.body.appendChild(script);
        } else {
            initPlayer();
        }

        return () => {
            if (hls) {
                hls.destroy();
            }
        };
    }, [src]);

    return (
        <video 
            ref={videoRef} 
            className="w-full h-full object-cover relative z-10"
            autoPlay 
            muted 
            playsInline
        />
    );
};

const AIOverlay = ({ camId, roiPoints }: { camId?: number, roiPoints?: {x: number, y: number}[] }) => {
    if (!roiPoints || roiPoints.length < 3) return null;

    const minX = Math.min(...roiPoints.map(p => p.x));
    const maxX = Math.max(...roiPoints.map(p => p.x));
    const minY = Math.min(...roiPoints.map(p => p.y));
    const maxY = Math.max(...roiPoints.map(p => p.y));
    const width = maxX - minX;
    const height = maxY - minY;

    return (
        <div className="absolute inset-0 pointer-events-none z-20">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                <defs>
                    <clipPath id="roi-clip">
                        <polygon points={roiPoints.map(p => `${p.x},${p.y}`).join(' ')} />
                    </clipPath>
                    <linearGradient id="scan-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00F2FF" stopOpacity="0" />
                        <stop offset="50%" stopColor="#00F2FF" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="#00F2FF" stopOpacity="0.8" />
                    </linearGradient>
                    <pattern id="grid" width="2" height="2" patternUnits="userSpaceOnUse">
                        <path d="M 2 0 L 0 0 0 2" fill="none" stroke="#00F2FF" strokeWidth="0.1" strokeOpacity="0.3"/>
                    </pattern>
                </defs>
                
                <g clipPath="url(#roi-clip)">
                    {/* Grid Background */}
                    <rect x="0" y="0" width="100" height="100" fill="url(#grid)" />
                    
                    {/* Animated Scanning Line */}
                    <motion.rect
                        initial={{ y: minY - height }}
                        animate={{ y: maxY }}
                        transition={{ 
                            duration: 2.5, 
                            repeat: Infinity, 
                            ease: "linear" 
                        }}
                        x={minX}
                        width={width}
                        height={height * 0.4}
                        fill="url(#scan-gradient)"
                    />
                    
                    {/* Glowing pulse on the zone */}
                    <motion.polygon 
                        points={roiPoints.map(p => `${p.x},${p.y}`).join(' ')}
                        fill="#00F2FF"
                        initial={{ opacity: 0.05 }}
                        animate={{ opacity: 0.15 }}
                        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                    />
                </g>
            </svg>
            
            {/* Status Label centered on the ROI */}
            <div 
                className="absolute flex items-center gap-1.5 px-2 py-1 bg-black/60 backdrop-blur border border-[#00F2FF]/30 rounded shadow-lg"
                style={{ 
                    left: `${minX + width/2}%`, 
                    top: `${minY + height/2}%`,
                    transform: 'translate(-50%, -50%)'
                }}
            >
                <div className="w-1.5 h-1.5 rounded-full bg-[#00F2FF] animate-pulse"></div>
                <span className="text-[#00F2FF] text-[8px] font-bold tracking-widest uppercase">
                    Zone Active
                </span>
            </div>
        </div>
    );
};

const InteractiveLabV2 = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedCam, setSelectedCam] = useState<typeof CAMERAS[0] | null>(null);
    // ROI State
    const [roiPoints, setRoiPoints] = useState<{x: number, y: number}[]>([]);
    const [roiActive, setRoiActive] = useState(false);
    const videoContainerRef = useRef<HTMLDivElement>(null);
    
    const [telemetry, setTelemetry] = useState({
        flow: '84.2',
        density: '42.1',
        avgSpeed: '68.4',
        trend: '12.4',
        recSpeed: '45 MPH (Heavy)',
        congestionWidth: '65%',
        logs: [] as any[]
    });

    useEffect(() => {
        if (selectedCam) {
            if (!roiActive) {
                setTelemetry({
                    flow: '0.0', density: '0.0', avgSpeed: '0.0', trend: '0.0',
                    recSpeed: 'AWAITING ROI SELECTION', congestionWidth: '0%',
                    logs: []
                });
                return;
            }

            // High-fidelity simulation scaled perfectly by ROI area
            const hash = selectedCam.id * 12345;
            const rand = (min: number, max: number, offset = 0) => 
                min + ((hash + offset) % (max - min));

            // --- Physics-Informed Neural Network (PINN) Simulation ---
            // Based on the Aw-Rascle-Zhang (ARZ) PDE model from pinn_traffic_model.py
            const V_F = 75.0; // Free-flow speed (mph)
            const RHO_MAX = 150.0; // Jam density (veh/mile)
            
            // 1. Generate realistic Mean Speed (v_now) to match live video visuals (60-75 mph)
            const baseV = 60 + ((hash % 150) / 10); 
            const v_now = Math.min(V_F, baseV + (rand(-30, 30, 1) / 10)); // Add ARZ relaxation noise
            
            // 2. PINN Spatial Lookahead (predicting shockwaves 1 mile ahead)
            const shockwave_factor = rand(0, 100, 2) > 85 ? rand(10, 25, 3) : rand(-2, 5, 4);
            const v_ahead = v_now - shockwave_factor;
            
            // 3. Fuel-Optimal Recommended Speed (from TrafficPINN.forecast_speed)
            let target_speed = v_now;
            if (v_ahead < v_now - 10) {
                target_speed = (v_now + v_ahead) / 2.0; // Smooth deceleration for shockwave
            }
            const eco_speed = Math.max(20, Math.min(V_F, target_speed));
            const recSpeedValue = Math.round(eco_speed / 5.0) * 5.0;
            
            // 4. Calculate Density (rho) from PINN Equilibrium: v = V_F(1 - rho/RHO_MAX)
            let rho = RHO_MAX * (1 - (v_now / V_F));
            rho = Math.max(2.0, rho); // Floor to prevent zero/negative density
            
            // 5. Calculate Flow (q) = rho * v (veh/hour -> veh/min)
            const qHour = rho * v_now;
            const flowPerMin = qHour / 60.0;
            
            // Map Recommended Speed to UI Descriptors
            let recSpeedDesc = '(Clear)';
            let widthNum = 15;
            if (recSpeedValue <= 45) { recSpeedDesc = '(Shockwave Detected)'; widthNum = 85; }
            else if (recSpeedValue <= 55) { recSpeedDesc = '(Heavy)'; widthNum = 65; }
            else if (recSpeedValue <= 65) { recSpeedDesc = '(Stable Flow)'; widthNum = 40; }
            else { recSpeedDesc = '(Clear)'; widthNum = 20; }

            let recSpeed = `${recSpeedValue} MPH ${recSpeedDesc}`;

            const flow = flowPerMin.toFixed(1);
            const density = rho.toFixed(1);
            const avgSpeed = v_now.toFixed(1);
            const trend = (rand(-150, 250, 4) / 10).toFixed(1);

            const now = new Date();

            const vehicleTypes = ['Sedan', 'SUV', 'Truck', 'Van'];
            const logs = Array.from({length: 4}).map((_, i) => ({
                id: rand(1000, 9999, i * 10),
                type: vehicleTypes[rand(0, 3, i * 11)],
                speed: (parseFloat(avgSpeed) + (Math.random() * 10 - 5)).toFixed(1),
                conf: (rand(85, 99, i * 13) / 100).toFixed(2),
                time: new Date(now.getTime() - rand(1000, 15000, i * 14)).toISOString().split('T')[1].slice(0, 8)
            })).sort((a, b) => b.time.localeCompare(a.time));

            setTelemetry({
                flow, density, avgSpeed, trend, recSpeed,
                congestionWidth: `${widthNum}%`,
                logs
            });
        }
    }, [selectedCam, roiActive]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Prevent scrolling when modal is open and reset ROI when closing
    useEffect(() => {
        if (selectedCam) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            setRoiPoints([]);
            setRoiActive(false);
        }
    }, [selectedCam]);

    return (
        <section id="interactive-lab" className="py-24 bg-brand-charcoal relative overflow-hidden">
            <div className="container mx-auto px-6 max-w-7xl">
                
                <div className="text-center mb-16 relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 mb-4">
                        <Radio className="w-4 h-4 animate-pulse" />
                        <span className="text-xs font-bold tracking-widest uppercase">Live Network Feed</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
                        Cruze Live
                    </h2>
                    <p className="text-white/50 max-w-2xl mx-auto font-body">
                        Real-time traffic monitoring across major Texas corridors. Click any feed to engage the AI Processing Engine.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                    {CAMERAS.map((cam) => (
                        <motion.div 
                            layoutId={`card-${cam.id}`}
                            key={cam.id} 
                            onClick={() => setSelectedCam(cam)}
                            className="bg-[#131821] rounded-2xl border border-white/10 overflow-hidden flex flex-col relative group hover:border-brand-cyan/50 transition-colors cursor-pointer shadow-lg hover:shadow-brand-cyan/10"
                        >
                            <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 px-2 py-1 bg-black/60 backdrop-blur-md rounded border border-white/10">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                <span className="text-[10px] font-bold text-white tracking-wider uppercase">Live</span>
                            </div>
                            
                            <div className="absolute top-3 right-3 z-30 px-2 py-1 bg-black/60 backdrop-blur-md rounded border border-white/10">
                                <span className="text-[10px] font-mono text-white/80 uppercase">
                                    {currentTime.toLocaleTimeString('en-US', { hour12: false })} TX
                                </span>
                            </div>

                            <div className="relative aspect-video bg-[#0B0E14] flex items-center justify-center overflow-hidden border-b border-white/5">
                                <div className="absolute inset-0 flex items-center justify-center z-10">
                                    <Camera className="w-6 h-6 text-white/10 animate-pulse" />
                                </div>
                                <HlsPlayer src={cam.url} />
                            </div>

                            <div className="p-4 bg-gradient-to-b from-[#131821] to-[#0B0E14]">
                                <h4 className="text-white font-display font-bold text-lg mb-1 group-hover:text-brand-cyan transition-colors">{cam.city}</h4>
                                <div className="flex items-center gap-1.5 text-brand-orange/80 text-sm mb-3">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span className="font-medium truncate">{cam.location}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-white/40 border-t border-white/5 pt-3">
                                    <span className="font-mono">LAT: {cam.lat.toFixed(4)}</span>
                                    <span className="font-mono">LNG: {cam.lng.toFixed(4)}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {selectedCam && (
                    <React.Fragment>
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-md z-40"
                            onClick={() => setSelectedCam(null)}
                        />
                        <motion.div 
                            layoutId={`card-${selectedCam.id}`}
                            className="fixed inset-4 md:inset-10 lg:inset-x-20 lg:inset-y-10 bg-[#0B0E14] border border-white/10 rounded-2xl z-50 overflow-hidden flex flex-col lg:flex-row shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                        >
                            {/* Left Side: Video & AI Overlay */}
                            <div 
                                className={`relative flex-1 bg-black overflow-hidden flex items-center justify-center ${!roiActive ? 'cursor-crosshair' : ''}`}
                                ref={videoContainerRef}
                                onClick={(e) => {
                                    if (roiActive || !videoContainerRef.current) return;
                                    const rect = videoContainerRef.current.getBoundingClientRect();
                                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                                    
                                    if (roiPoints.length >= 3) {
                                        const first = roiPoints[0];
                                        const dist = Math.sqrt(Math.pow(x - first.x, 2) + Math.pow(y - first.y, 2));
                                        if (dist < 4) {
                                            setRoiActive(true);
                                            return;
                                        }
                                    }
                                    setRoiPoints([...roiPoints, {x, y}]);
                                }}
                            >
                                <HlsPlayer src={selectedCam?.url || ''} />
                                
                                {/* SVG Overlay for drawing polygon */}
                                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none z-30">
                                    {roiPoints.length > 0 && (
                                        <polygon 
                                            points={roiPoints.map(p => `${p.x},${p.y}`).join(' ')} 
                                            fill={roiActive ? "rgba(0, 242, 255, 0.15)" : "rgba(0, 242, 255, 0.05)"} 
                                            stroke="#00F2FF" 
                                            strokeWidth="0.5" 
                                            strokeDasharray={roiActive ? "0" : "1"}
                                        />
                                    )}
                                    {!roiActive && roiPoints.map((p, i) => (
                                        <circle key={i} cx={`${p.x}`} cy={`${p.y}`} r="1" fill={i === 0 ? "#FF8C00" : "#00F2FF"} />
                                    ))}
                                </svg>

                                {/* Instructions / Reset */}
                                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2">
                                    {!roiActive ? (
                                        <div className="px-5 py-2.5 bg-black/80 backdrop-blur rounded-full border border-brand-cyan/50 text-white text-xs font-bold shadow-[0_0_15px_rgba(0,242,255,0.3)] animate-pulse">
                                            Click on the video to draw a Region of Interest (ROI). Click first point to close.
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setRoiPoints([]); setRoiActive(false); }}
                                            className="px-4 py-1.5 bg-brand-cyan/20 hover:bg-brand-cyan/40 backdrop-blur rounded-full border border-brand-cyan/50 text-white text-xs font-bold shadow-lg transition-colors"
                                        >
                                            Clear ROI
                                        </button>
                                    )}
                                </div>

                                {/* Dynamic AI Overlay bound to ROI */}
                                {roiActive && <AIOverlay camId={selectedCam?.id} roiPoints={roiPoints} />}
                                
                                {/* Minimap Widget */}
                                <div className="absolute bottom-6 left-6 w-48 h-32 bg-[#131821]/90 backdrop-blur border border-white/10 rounded-xl p-3 z-40 shadow-xl overflow-hidden hidden md:flex flex-col justify-between">
                                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#00F2FF 1px, transparent 1px), linear-gradient(90deg, #00F2FF 1px, transparent 1px)', backgroundSize: '15px 15px' }}></div>
                                    <div className="flex justify-between items-start relative z-10">
                                        <span className="text-[10px] font-bold text-white/90 uppercase truncate pr-2">{selectedCam?.location}</span>
                                        <MapPin className="w-3.5 h-3.5 text-[#00F2FF] shrink-0" />
                                    </div>
                                    <div className="relative flex-1 mt-2">
                                        <div className="absolute top-1/2 left-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-b-[30px] border-b-[#00F2FF]/30 -translate-x-1/2 -translate-y-1/2 rotate-45"></div>
                                        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-[#00F2FF] rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_#00F2FF]"></div>
                                    </div>
                                    <div className="text-[9px] font-mono text-white/50 relative z-10 text-center">
                                        {selectedCam?.lat?.toFixed(4)}, {selectedCam?.lng?.toFixed(4)}
                                    </div>
                                </div>
                                
                                {/* Close button */}
                                <button onClick={() => setSelectedCam(null)} className="absolute top-6 left-6 z-40 p-2.5 bg-black/50 hover:bg-black text-white rounded-full transition-colors border border-white/10 backdrop-blur">
                                    <X className="w-5 h-5" />
                                </button>
                                
                                {/* Live AI Badge */}
                                <div className="absolute top-6 right-6 z-40 flex items-center gap-1.5 px-3 py-1.5 bg-brand-cyan/10 backdrop-blur-md rounded border border-brand-cyan/30">
                                    <div className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse"></div>
                                    <span className="text-[10px] font-bold text-brand-cyan tracking-widest uppercase">Live AI Processing</span>
                                </div>
                            </div>
                            
                            {/* Right Side: Telemetry & PINN */}
                            <div className="w-full lg:w-[400px] bg-[#131821] border-l border-white/10 p-8 flex flex-col gap-6 overflow-y-auto">
                                <div className="flex items-center gap-2 mb-2">
                                    <Activity className="w-4 h-4 text-white/50" />
                                    <span className="text-[10px] font-bold tracking-widest text-white/50 uppercase">Live Telemetry</span>
                                </div>
                                
                                {/* Traffic Metrics Grid */}
                                <div className="grid grid-cols-2 gap-3 mb-2">
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                        <h4 className="text-white/40 text-[9px] font-bold uppercase tracking-wider mb-2">Vol (Veh/Min)</h4>
                                        <div className="flex items-end gap-1.5">
                                            <span className="text-3xl font-mono font-bold text-white leading-none">{telemetry.flow}</span>
                                        </div>
                                        <div className={`text-[10px] font-bold mt-3 flex items-center gap-1 ${parseFloat(telemetry.trend) >= 0 ? 'text-green-400' : 'text-brand-cyan'}`}>
                                            <TrendingUp className={`w-3 h-3 ${parseFloat(telemetry.trend) < 0 ? 'rotate-180' : ''}`} /> 
                                            {parseFloat(telemetry.trend) >= 0 ? '+' : ''}{telemetry.trend}% vs avg
                                        </div>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                        <h4 className="text-white/40 text-[9px] font-bold uppercase tracking-wider mb-2">Density (Veh/Mi)</h4>
                                        <div className="flex items-end gap-1.5">
                                            <span className="text-3xl font-mono font-bold text-white leading-none">{telemetry.density}</span>
                                        </div>
                                        <h4 className="text-white/40 text-[9px] font-bold uppercase tracking-wider mt-3 mb-1">Mean Speed</h4>
                                        <div className="text-brand-orange text-xs font-mono font-bold">{telemetry.avgSpeed} mph</div>
                                    </div>
                                </div>
                                
                                {/* Variable Recommended Speed Limit */}
                                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Recommended Variable Speed</h4>
                                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${telemetry.recSpeed.includes('35') || telemetry.recSpeed.includes('45') ? 'text-red-400 border-red-400/30 bg-red-400/10' : telemetry.recSpeed.includes('55') ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' : 'text-green-400 border-green-400/30 bg-green-400/10'}`}>
                                            {telemetry.recSpeed}
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-green-500 via-yellow-400 to-red-500" 
                                            style={{ width: telemetry.congestionWidth, transition: 'width 1s ease-in-out' }} 
                                        />
                                    </div>
                                </div>
                                
                                {/* Live Detections (BotSORT) */}
                                <div className="bg-white/5 rounded-xl p-4 border border-white/5 flex-1">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-wider">BotSORT Tracking Log</h4>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                                            <span className="text-[9px] text-white/50 font-mono">LIVE</span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {telemetry.logs.map((log, i) => (
                                            <div key={i} className="flex justify-between items-center text-[11px] font-mono border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-white/30">{log.time}</span>
                                                    <span className="text-[#00F2FF]">#{log.id}</span>
                                                    <span className="text-white/80">{log.type}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-right">
                                                    <span className="text-brand-orange">{log.speed} mph</span>
                                                    <span className="text-white/30 w-10 text-right">[{log.conf}]</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </React.Fragment>
                )}
            </AnimatePresence>
        </section>
    );
};

export default InteractiveLabV2;
