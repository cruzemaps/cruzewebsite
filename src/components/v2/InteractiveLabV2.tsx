import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, MapPin, Radio, X, BrainCircuit, AlertTriangle, TrendingUp, CheckCircle2, Activity, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import YoloOverlay, { type Box as YoloBox } from './YoloOverlay';

// Each camera is mapped to a *traffic regime* — a stable characterization of
// the flow state the demo should portray for that feed. The regime drives
// sampled ranges for mean speed, density, throughput, and BotSORT entries so
// the numbers stay believable for the visible camera frame. We don't run a
// hard Greenshields-from-speed derivation because the displayed values are
// per-ROI, not full-corridor capacity flow; the equilibrium form scales the
// metrics together but each one is bounded to per-ROI ranges.
type Severity = 'clear' | 'stable' | 'heavy' | 'shock';

type Regime = {
    severity: Severity;
    vMean: number;     vJit: number;     // mph
    rhoMean: number;   rhoJit: number;   // veh/mi
    flowMean: number;  flowJit: number;  // veh/min through ROI
    shockProb: number;                   // 0..1 — chance of a shockwave ahead
    logCount: number;                    // typical BotSORT entries shown
};

const REGIMES: Record<Severity, Regime> = {
    clear:  { severity: 'clear',  vMean: 70, vJit: 3, rhoMean: 6,   rhoJit: 3,  flowMean: 4,  flowJit: 2, shockProb: 0.02, logCount: 1 },
    stable: { severity: 'stable', vMean: 55, vJit: 5, rhoMean: 22,  rhoJit: 6,  flowMean: 12, flowJit: 4, shockProb: 0.10, logCount: 2 },
    heavy:  { severity: 'heavy',  vMean: 35, vJit: 5, rhoMean: 60,  rhoJit: 12, flowMean: 22, flowJit: 6, shockProb: 0.30, logCount: 3 },
    shock:  { severity: 'shock',  vMean: 20, vJit: 5, rhoMean: 100, rhoJit: 15, flowMean: 14, flowJit: 6, shockProb: 0.55, logCount: 4 },
};

// Camera ↔ regime + pre-recorded fallback. Major interstates get heavier
// regimes; Fort Worth FM-1709 is an FM road (low traffic) and stays in
// `clear`. preRecordedUrl is a same-origin MP4 that the HLS player swaps in
// when the live skyvdn.com feed errors or when the clock crosses into night
// mode — same-origin means the canvas isn't tainted, so frame capture for
// the vision pipeline still works against the recorded clip.
const FALLBACK_MP4 = '/cruze-web.mp4';

// Single curated feed for the YOLO demo — San Antonio IH-10 is the most
// reliably-busy live stream and gives the in-browser detector consistent
// vehicles to box.
const CAMERAS: Array<{
    id: number; city: string; location: string; lat: number; lng: number;
    url: string; preRecordedUrl: string; regime: Regime;
}> = [
    { id: 4, city: 'San Antonio', location: 'IH-10', lat: 29.4241, lng: -98.4936, url: 'https://s70.us-east-1.skyvdn.com:443/rtplive/TX_AUS_262/playlist.m3u8', preRecordedUrl: FALLBACK_MP4, regime: REGIMES.stable },
];

const V_F = 75.0;

function severityLabel(s: Severity): string {
    switch (s) {
        case 'shock':  return '(Shockwave Detected)';
        case 'heavy':  return '(Heavy)';
        case 'stable': return '(Stable Flow)';
        case 'clear':  return '(Clear)';
    }
}

function severityWidth(s: Severity): number {
    switch (s) {
        case 'shock':  return 90;
        case 'heavy':  return 65;
        case 'stable': return 40;
        case 'clear':  return 18;
    }
}

function severityBadgeClass(s: Severity): string {
    switch (s) {
        case 'shock':
        case 'heavy':  return 'text-red-400 border-red-400/30 bg-red-400/10';
        case 'stable': return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
        case 'clear':  return 'text-green-400 border-green-400/30 bg-green-400/10';
    }
}

type Track = {
    id: number;
    type: string;
    firstSeen: Date;
    // Last-seen position + class info, used for nearest-neighbor matching
    // across detection ticks so the ID stays stable for the same vehicle.
    lastCx?: number;
    lastCy?: number;
    lastCls?: string;
    lastConf?: number;
};

// Standard ray-cast point-in-polygon. Polygon in 0-100 % space, point too.
function pointInPoly(x: number, y: number, polygon: { x: number; y: number }[]): boolean {
    if (polygon.length < 3) return true; // no ROI drawn → everything counts
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;
        const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-9) + xi;
        if (intersect) inside = !inside;
    }
    return inside;
}

// Map coco-ssd classes to the friendly labels shown in the BotSORT log.
function classToType(cls: string): string {
    switch (cls) {
        case "truck":      return "Truck";
        case "bus":        return "Bus";
        case "motorcycle": return "Moto";
        case "bicycle":    return "Bike";
        case "car":
        default:           return "Sedan";
    }
}

const HlsPlayer = ({ src, fallbackSrc = FALLBACK_MP4 }: { src: string; fallbackSrc?: string }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        let hls: any = null;
        let destroyed = false;

        const loadFallback = () => {
            const video = videoRef.current;
            if (!video || destroyed) return;
            if (hls) { hls.destroy(); hls = null; }
            video.src = fallbackSrc;
            video.loop = true;
            video.play().catch(() => {});
        };

        const initPlayer = () => {
            const video = videoRef.current;
            if (!video || destroyed) return;

            video.pause();

            if (src.endsWith('.mp4')) {
                video.src = src;
                video.loop = true;
                video.play().catch(e => console.log('Autoplay prevented:', e));
                return;
            }

            if ((window as any).Hls && (window as any).Hls.isSupported()) {
                hls = new (window as any).Hls({
                    maxBufferLength: 10,
                    maxMaxBufferLength: 20,
                    manifestLoadingTimeOut: 8000,
                    manifestLoadingMaxRetry: 2,
                    levelLoadingTimeOut: 8000,
                    levelLoadingMaxRetry: 2,
                });
                hls.loadSource(src);
                hls.attachMedia(video);
                hls.on((window as any).Hls.Events.MANIFEST_PARSED, () => {
                    video.play().catch(e => console.log('Autoplay prevented:', e));
                });
                hls.on((window as any).Hls.Events.ERROR, (_: any, data: any) => {
                    if (data.fatal) {
                        console.warn(`[HLS] Fatal error on ${src}, falling back to recorded feed.`);
                        loadFallback();
                    }
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = src;
                video.addEventListener('loadedmetadata', () => {
                    video.play().catch(e => console.log('Autoplay prevented:', e));
                });
                video.addEventListener('error', () => {
                    console.warn(`[HLS Safari] Error on ${src}, falling back to recorded feed.`);
                    loadFallback();
                }, { once: true });
            }
        };

        if (typeof window !== 'undefined' && !(window as any).Hls) {
            const script = document.createElement('script');
            // Pinned version + SRI: never load `@latest` — a compromised or
            // breaking CDN publish would execute arbitrary JS on the live site.
            script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.20/dist/hls.min.js';
            script.integrity = 'sha384-V5ruNBgmYcC3SJRUQeNykAAAgde5gOFq/Hu0CZj7bygDP0yRIhkvX8+w0u/7mRvr';
            script.crossOrigin = 'anonymous';
            script.async = true;
            script.onload = initPlayer;
            document.body.appendChild(script);
        } else {
            initPlayer();
        }

        return () => {
            destroyed = true;
            if (hls) {
                hls.destroy();
            }
        };
    }, [src]);

    return (
        <video
            ref={videoRef}
            // crossOrigin="anonymous" is what lets the canvas read pixels from
            // the cross-origin HLS stream. Without this, even though
            // skyvdn.com sends Access-Control-Allow-Origin: *, the browser
            // taints the canvas on drawImage() and toDataURL() throws —
            // which silently disables the vision pipeline and we fall back
            // to the regime simulation. With it set, frame capture works
            // and the worker gets real frames.
            crossOrigin="anonymous"
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
    // Single-feed lab: auto-select the one camera so the viewer is visible
    // the whole time instead of behind a click-to-open modal. No grid, no
    // close button, no AnimatePresence — the camera + telemetry panel just
    // render inline on the page. The setter is kept (unused) so the existing
    // dead modal click handlers don't break before we strip the JSX below.
    const [selectedCam, setSelectedCam] = useState<typeof CAMERAS[0] | null>(CAMERAS[0]);
    void setSelectedCam;
    const [forceNightMode, setForceNightMode] = useState(false);
    
    // Determine if it is night time (9 PM to 8 AM) or forced
    const currentHour = currentTime.getHours();
    const isActualNightTime = currentHour >= 21 || currentHour < 8;
    const isNightTime = forceNightMode || isActualNightTime;
    
    // Keyboard shortcut for quick testing
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.shiftKey && e.key.toLowerCase() === 'n') {
                setForceNightMode(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
    // ROI State
    const [roiPoints, setRoiPoints] = useState<{x: number, y: number}[]>([]);
    const [roiActive, setRoiActive] = useState(false);
    const videoContainerRef = useRef<HTMLDivElement>(null);
    
    const [telemetry, setTelemetry] = useState({
        flow: '0.0',
        density: '0.0',
        avgSpeed: '0.0',
        trend: '0.0',
        recSpeed: 'AWAITING ROI SELECTION',
        congestionWidth: '0%',
        severity: 'clear' as Severity,
        logs: [] as any[]
    });

    // Hold previous v_now across ticks so the displayed speed EMAs smoothly
    // instead of teleporting between samples.
    const prevVRef = useRef<number>(0);
    // Persisted BotSORT-style tracks: synthetic stable IDs assigned to YOLO
    // detections as they appear. Ages out boxes that haven't been seen for a
    // tick or two so the log doesn't grow without bound.
    const tracksRef = useRef<Track[]>([]);
    const nextIdRef = useRef<number>(1000);
    // Latest YOLO detection set, refreshed at ~3 FPS by YoloOverlay's
    // onDetections callback. The 1s telemetry tick reads from this ref to
    // produce throughput / density / severity from the actual visible cars.
    const detectionsRef = useRef<YoloBox[]>([]);
    // Surfaces to the UI: detector loaded yet?
    const [detectorReady, setDetectorReady] = useState(false);

    // Frame capture target — the modal mounts <HlsPlayer> inside this container.
    // YoloOverlay queries this for the <video> element to run inference on.
    const getModalVideo = useCallback((): HTMLVideoElement | null => {
        return videoContainerRef.current?.querySelector("video") ?? null;
    }, []);

    // Receive each YOLO tick. Stored in a ref so the telemetry interval can
    // read the latest without re-rendering this component every 330ms.
    const handleDetections = useCallback((boxes: YoloBox[]) => {
        detectionsRef.current = boxes;
    }, []);

    useEffect(() => {
        if (!selectedCam) return;

        // Reset cross-tick state every time the cam or ROI toggles.
        prevVRef.current = selectedCam.regime.vMean;
        tracksRef.current = [];
        nextIdRef.current = 1000 + Math.floor(Math.random() * 8000);

        if (!roiActive) {
            setTelemetry({
                flow: '0.0', density: '0.0', avgSpeed: '0.0', trend: '0.0',
                recSpeed: 'AWAITING ROI SELECTION', congestionWidth: '0%',
                severity: 'clear', logs: []
            });
            return;
        }

        const tick = () => {
            const boxes = detectionsRef.current;

            // Boxes whose centers fall inside the user's ROI polygon. The
            // telemetry only reflects what they selected.
            const inRoi = boxes.filter((b) =>
                pointInPoly(b.x + b.w / 2, b.y + b.h / 2, roiPoints),
            );
            const count = inRoi.length;

            // Density estimate scales with what's actually visible in the
            // ROI. The constant maps "boxes in ROI" → "veh/mi" at a
            // believable spread (4 boxes ≈ 32 veh/mi). Tunable.
            const rho = Math.max(0, count * 8 + (Math.random() - 0.5) * 3);

            // Speed via Greenshields equilibrium: v = V_F * (1 - rho/RHO_MAX).
            // Higher density → slower. EMA-smoothed so the displayed mph
            // doesn't whiplash when a box appears or disappears.
            const RHO_MAX = 150;
            const vEquil = V_F * (1 - Math.min(1, rho / RHO_MAX));
            const v_now = Math.max(8, prevVRef.current * 0.75 + vEquil * 0.25);
            prevVRef.current = v_now;

            const flowPerMin = count <= 0 ? 0 : count * 3.2 + (Math.random() - 0.5) * 1.5;

            // Severity bands by visible count inside the ROI.
            const severity: Severity =
                count >= 12 ? 'shock' :
                count >= 6 ? 'heavy' :
                count >= 2 ? 'stable' :
                'clear';

            const recSpeedValue =
                severity === 'shock' ? 25 :
                severity === 'heavy' ? 40 :
                severity === 'stable' ? 55 :
                65;

            const trend = (Math.random() - 0.4) * 25;

            // BotSORT log: persist a stable ID per detected box across ticks
            // using a nearest-neighbor match on box centers. Boxes that
            // disappear for a tick age out; new boxes get fresh IDs.
            const now = new Date();
            const matched = new Set<number>();
            const nextTracks: Track[] = [];
            inRoi.forEach((b) => {
                const cx = b.x + b.w / 2;
                const cy = b.y + b.h / 2;
                // Find nearest existing track within 12% of frame as a match.
                let best: { t: Track; d: number } | null = null;
                for (const t of tracksRef.current) {
                    if (matched.has(t.id) || !t.lastCx) continue;
                    const d = Math.hypot(cx - t.lastCx, cy - t.lastCy);
                    if (!best || d < best.d) best = { t, d };
                }
                if (best && best.d < 12) {
                    matched.add(best.t.id);
                    nextTracks.push({ ...best.t, lastCx: cx, lastCy: cy, lastCls: b.cls, lastConf: b.conf });
                } else {
                    nextTracks.push({
                        id: nextIdRef.current++,
                        type: classToType(b.cls),
                        firstSeen: now,
                        lastCx: cx,
                        lastCy: cy,
                        lastCls: b.cls,
                        lastConf: b.conf,
                    });
                }
            });
            tracksRef.current = nextTracks;

            const logs = nextTracks.slice(0, 4).map((t) => ({
                id: t.id,
                type: t.type,
                speed: Math.max(0, v_now + (Math.random() * 8 - 4)).toFixed(1),
                conf: (t.lastConf ?? 0.9).toFixed(2),
                time: t.firstSeen.toISOString().split('T')[1].slice(0, 8),
            }));

            setTelemetry({
                flow: flowPerMin.toFixed(1),
                density: rho.toFixed(1),
                avgSpeed: v_now.toFixed(1),
                trend: trend.toFixed(1),
                recSpeed: `${recSpeedValue} MPH ${severityLabel(severity)}`,
                congestionWidth: `${severityWidth(severity)}%`,
                severity,
                logs,
            });
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [selectedCam, roiActive, roiPoints]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section id="interactive-lab" className="pb-24 bg-brand-charcoal">
            <div className="container mx-auto px-6 max-w-7xl">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-500 border-red-500/20 border">
                        <Radio className="w-4 h-4 animate-pulse" />
                        <span className="text-xs font-bold tracking-widest uppercase">
                            Live Network Feed
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-white/40 uppercase">
                            {currentTime.toLocaleTimeString('en-US', { hour12: false })} TX
                        </span>
                        <button
                            onClick={() => setForceNightMode(!forceNightMode)}
                            className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-white/30 hover:text-white/80 bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors"
                            title="Toggle Night Mode (Shift+N)"
                        >
                            Test Night
                        </button>
                    </div>
                </div>
            </div>

            {/* Inline camera + telemetry panel — always visible, no click-to-open. */}
            <div className="container mx-auto px-6 max-w-7xl">
                {selectedCam && (
                    <div
                        className="bg-[#0B0E14] border border-white/10 rounded-2xl overflow-hidden flex flex-col lg:flex-row shadow-2xl"
                        style={{ minHeight: '70vh' }}
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
                                {/* Always show the real camera feed so the YOLO demo runs on actual
                                    traffic. We no longer swap in the cruze-web.mp4 promo clip at night
                                    (it has no vehicles to detect, so the demo looked broken). The
                                    HlsPlayer still falls back gracefully if a feed is truly down.
                                    TODO(anudeep): add a recorded daytime traffic loop as the night/offline fallback. */}
                                <HlsPlayer src={selectedCam?.url || ''} />

                                {/* In-browser YOLO (coco-ssd) — live bounding
                                    boxes around detected vehicles. The same
                                    detections are passed to handleDetections so
                                    the telemetry panel is driven by real
                                    counts, not a regime simulation. */}
                                <YoloOverlay
                                    getVideo={getModalVideo}
                                    enabled={!!selectedCam}
                                    roiPoints={roiPoints}
                                    roiActive={roiActive}
                                    onDetections={handleDetections}
                                    onReady={() => setDetectorReady(true)}
                                />

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
                                        <circle key={i} cx={`${p.x}`} cy={`${p.y}`} r="1" fill={i === 0 ? "#E8590C" : "#00F2FF"} />
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
                                
                                {/* Detector status badge — reflects whether the
                                    in-browser YOLO model has finished loading
                                    and is producing live detections. */}
                                <div className={`absolute top-6 right-6 z-40 flex items-center gap-1.5 px-3 py-1.5 backdrop-blur-md rounded border ${detectorReady ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/20'}`}>
                                    <div className={`w-2 h-2 rounded-full animate-pulse ${detectorReady ? 'bg-emerald-400' : 'bg-white/40'}`}></div>
                                    <span className={`text-[10px] font-bold tracking-widest uppercase ${detectorReady ? 'text-emerald-300' : 'text-white/60'}`}>
                                        {detectorReady ? 'Live YOLO Detection' : 'Initializing detector…'}
                                    </span>
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
                                        <h4 className="text-white/40 text-[9px] font-bold uppercase tracking-wider mb-2">Throughput (Veh/Min)</h4>
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
                                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${severityBadgeClass(telemetry.severity)}`}>
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
                                        {telemetry.logs.length === 0 ? (
                                            <div className="text-[11px] font-mono text-white/30 italic py-2">
                                                {telemetry.recSpeed === 'AWAITING ROI SELECTION'
                                                    ? 'Awaiting ROI selection…'
                                                    : 'No vehicles currently in ROI.'}
                                            </div>
                                        ) : telemetry.logs.map((log, i) => (
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
                    </div>
                )}
            </div>
        </section>
    );
};

export default InteractiveLabV2;
