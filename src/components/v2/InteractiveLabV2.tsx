import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, MapPin, Radio, X, BrainCircuit, AlertTriangle, TrendingUp, CheckCircle2, Activity, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

// Curated to the three cleanest, most reliably-busy live feeds. Dallas,
// Fort Worth, and El Paso were dropped — their streams either go dark
// frequently or show low-traffic corridors that don't sell the demo.
const CAMERAS: Array<{
    id: number; city: string; location: string; lat: number; lng: number;
    url: string; preRecordedUrl: string; regime: Regime;
}> = [
    { id: 2, city: 'Houston',     location: 'IH-45', lat: 29.7604, lng: -95.3698, url: 'https://s70.us-east-1.skyvdn.com:443/rtplive/TX_HOU_1002/playlist.m3u8', preRecordedUrl: FALLBACK_MP4, regime: REGIMES.shock },
    { id: 3, city: 'Austin',      location: 'IH-35', lat: 30.2672, lng: -97.7431, url: 'https://s70.us-east-1.skyvdn.com:443/rtplive/TX_AUS_263/playlist.m3u8',  preRecordedUrl: FALLBACK_MP4, regime: REGIMES.heavy },
    { id: 4, city: 'San Antonio', location: 'IH-10', lat: 29.4241, lng: -98.4936, url: 'https://s70.us-east-1.skyvdn.com:443/rtplive/TX_AUS_262/playlist.m3u8',  preRecordedUrl: FALLBACK_MP4, regime: REGIMES.clear },
];

const V_F = 75.0;

const VEHICLE_TYPES = ['Sedan', 'SUV', 'Truck', 'Van'];

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

function jit(mean: number, jit: number) {
    return mean + (Math.random() - 0.5) * 2 * jit;
}

// One simulation step. Each metric samples within its regime band; v_now is
// EMA-smoothed with the previous tick so the live readout drifts instead of
// thrashing. Returned values are ready to render.
function tickPINN(prevV: number, regime: Regime) {
    const vTarget = jit(regime.vMean, regime.vJit);
    const v_now = Math.max(5, Math.min(V_F, prevV * 0.7 + vTarget * 0.3));
    const rho = Math.max(0.5, jit(regime.rhoMean, regime.rhoJit));
    const flowPerMin = Math.max(0, jit(regime.flowMean, regime.flowJit));

    // Recommended speed: anchor on regime mean, then nudge down if a shockwave
    // is flagged ahead. Keeps the badge severity aligned with the regime most
    // of the time.
    const hasShock = Math.random() < regime.shockProb;
    const shockwave = hasShock ? 8 + Math.random() * 12 : 0;
    const target_speed = Math.max(20, Math.min(V_F, v_now - shockwave * 0.5));
    const recSpeedValue = Math.round(target_speed / 5) * 5;
    const severity: Severity = hasShock && regime.severity !== 'clear' ? 'shock' : regime.severity;

    const trend = (Math.random() - 0.4) * 25;

    return {
        v_now,
        flow: flowPerMin.toFixed(1),
        density: rho.toFixed(1),
        avgSpeed: v_now.toFixed(1),
        trend: trend.toFixed(1),
        recSpeed: `${recSpeedValue} MPH ${severityLabel(severity)}`,
        congestionWidth: `${severityWidth(severity)}%`,
        severity,
    };
}

type Track = { id: number; type: string; firstSeen: Date };

// AnalysisResult mirrors the worker's response. When the worker is reachable
// the SPA prefers these (real CV on the live frame) over the regime simulation.
type AnalysisResult = {
    count: number;
    meanSpeedMph: number;
    density: number;
    severity: Severity;
    recommendedSpeedMph: number;
};

// Frame-analyze worker URL. Overridable via VITE_FRAME_ANALYZE_URL for dev.
// The worker holds the Anthropic key as a wrangler secret — the SPA never
// sees the key, it just POSTs base64 frames and receives JSON back.
const FRAME_ANALYZE_URL =
    (import.meta.env.VITE_FRAME_ANALYZE_URL as string | undefined) ||
    "https://analyze.cruzemaps.com/analyze";

// Render a still frame from a <video> to a data URL, masked to the user's
// ROI polygon so the vision model only sees the region they selected.
// Pixels outside the polygon are filled with black; the worker's prompt
// tells the model that black regions are masked-out and should not be
// counted. Returns null if the video isn't ready, the canvas is tainted
// (cross-origin HLS without CORS), or any other capture error occurs.
//
// roiPoints are in 0-100 percentage space (the same units the SVG overlay
// uses), so they map cleanly to the downsampled capture canvas.
function captureFrameFromVideo(
    video: HTMLVideoElement | null,
    roiPoints: { x: number; y: number }[],
): string | null {
    if (!video) return null;
    if (video.readyState < 2) return null; // HAVE_CURRENT_DATA
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return null;

    const targetW = Math.min(640, w);
    const targetH = Math.round(targetW * (h / w));

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    try {
        if (roiPoints.length >= 3) {
            // Black background, then clip the draw to the polygon so only
            // the ROI shows pixels from the video frame.
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, targetW, targetH);
            ctx.save();
            ctx.beginPath();
            ctx.moveTo((roiPoints[0].x / 100) * targetW, (roiPoints[0].y / 100) * targetH);
            for (let i = 1; i < roiPoints.length; i++) {
                ctx.lineTo((roiPoints[i].x / 100) * targetW, (roiPoints[i].y / 100) * targetH);
            }
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(video, 0, 0, targetW, targetH);
            ctx.restore();
        } else {
            // Defensive — the analyze loop only fires when roiActive is true,
            // which requires >= 3 points. If we ever get here, fall back to
            // the unmasked frame rather than uploading a black image.
            ctx.drawImage(video, 0, 0, targetW, targetH);
        }
        return canvas.toDataURL("image/jpeg", 0.7);
    } catch (err) {
        // Most common cause: HLS source served without Access-Control-Allow-Origin
        // → canvas tainted → toDataURL throws SecurityError. We log once and let
        // the simulation take over.
        if (typeof console !== "undefined") console.warn("[InteractiveLab] Frame capture blocked:", err);
        return null;
    }
}

// Tick variant used when we have a fresh AnalysisResult from the worker. The
// API gives us ground truth for count/regime/recommendedSpeed; we blend mean
// speed into the existing EMA so the displayed value still moves smoothly
// instead of snapping every 10s.
function tickFromApi(prevV: number, api: AnalysisResult): {
    v_now: number; flow: string; density: string; avgSpeed: string; trend: string;
    recSpeed: string; congestionWidth: string; severity: Severity; targetCount: number;
} {
    const vTarget = api.meanSpeedMph + (Math.random() - 0.5) * 3;
    const v_now = Math.max(0, Math.min(V_F, prevV * 0.8 + vTarget * 0.2));
    const rho = Math.max(0, api.density + (Math.random() - 0.5) * 3);

    // Per-ROI throughput estimate scales with visible count, not corridor
    // capacity flow. Empty frame → 0. Heavy frame → ~30/min. This matches
    // user intuition that "no cars in frame" should not read 35 veh/min.
    const flowPerMin = api.count <= 0 ? 0 : Math.max(0, api.count * 3.2 + (Math.random() - 0.5) * 1.5);

    const recSpeedValue = api.recommendedSpeedMph;
    const trend = (Math.random() - 0.4) * 25;

    return {
        v_now,
        flow: flowPerMin.toFixed(1),
        density: rho.toFixed(1),
        avgSpeed: v_now.toFixed(1),
        trend: trend.toFixed(1),
        recSpeed: `${recSpeedValue} MPH ${severityLabel(api.severity)}`,
        congestionWidth: `${severityWidth(api.severity)}%`,
        severity: api.severity,
        targetCount: api.count,
    };
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
            script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
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
    const [selectedCam, setSelectedCam] = useState<typeof CAMERAS[0] | null>(null);
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

    // Hold previous v_now across ticks so the simulation EMAs smoothly instead
    // of teleporting between samples. Reset on cam change / ROI deactivate.
    const prevVRef = useRef<number>(0);
    // BotSORT-style track persistence: vehicle IDs stay stable across ticks
    // until they age out, so the log doesn't invent fresh detections every
    // 1.3s on an empty road.
    const tracksRef = useRef<Track[]>([]);
    const nextIdRef = useRef<number>(1000);
    // Latest worker analysis result. The tick prefers this when fresh and
    // falls back to the regime simulation otherwise.
    const apiResultRef = useRef<{ result: AnalysisResult; at: number } | null>(null);
    // Surfaces to the UI: are we currently driving telemetry from real CV?
    const [visionOnline, setVisionOnline] = useState(false);

    // Frame capture target — the modal mounts <HlsPlayer> inside this container.
    // We query for the <video> at call time rather than refactoring HlsPlayer.
    const getModalVideo = useCallback((): HTMLVideoElement | null => {
        return videoContainerRef.current?.querySelector("video") ?? null;
    }, []);

    // One-shot vision call when the user closes their ROI polygon. The
    // result is held for the lifetime of this ROI — the analyze is the
    // user's deliberate "tell me about this area" act, not background
    // polling. To get a fresh read they Clear ROI and redraw. Falls back
    // to the simulation on any failure (network, CORS-tainted canvas,
    // model JSON parse error, worker missing secret).
    //
    // Video may need a beat after ROI activate before the frame is
    // capture-ready, so retry with a short backoff a few times before
    // giving up.
    useEffect(() => {
        if (!selectedCam || !roiActive) return;

        let cancelled = false;
        let attempt = 0;

        const analyze = async (): Promise<void> => {
            attempt += 1;
            const frame = captureFrameFromVideo(getModalVideo(), roiPoints);
            if (!frame) {
                // Video not ready yet — retry a few times before giving up
                // to the simulation. CORS-taint failures also land here and
                // retrying won't help, but the cost is just three setTimeouts.
                if (attempt < 4 && !cancelled) {
                    setTimeout(analyze, 600);
                }
                return;
            }

            try {
                const resp = await fetch(FRAME_ANALYZE_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ frame }),
                });
                if (!resp.ok) throw new Error(`status ${resp.status}`);
                const data = (await resp.json()) as { ok: boolean; result?: AnalysisResult; error?: string };
                if (cancelled) return;
                if (!data.ok || !data.result) {
                    console.warn("[InteractiveLab] Analyze returned error:", data.error);
                    return;
                }
                apiResultRef.current = { result: data.result, at: Date.now() };
                setVisionOnline(true);
            } catch (err) {
                if (!cancelled) console.warn("[InteractiveLab] Analyze fetch failed:", err);
            }
        };

        analyze();
        return () => {
            cancelled = true;
        };
    }, [selectedCam, roiActive, roiPoints, getModalVideo]);

    useEffect(() => {
        if (!selectedCam) return;

        // Reset cross-tick state every time the cam or ROI toggles.
        prevVRef.current = selectedCam.regime.vMean;
        tracksRef.current = [];
        nextIdRef.current = 1000 + Math.floor(Math.random() * 8000);
        apiResultRef.current = null;
        setVisionOnline(false);

        if (!roiActive) {
            setTelemetry({
                flow: '0.0', density: '0.0', avgSpeed: '0.0', trend: '0.0',
                recSpeed: 'AWAITING ROI SELECTION', congestionWidth: '0%',
                severity: 'clear', logs: []
            });
            return;
        }

        const tick = () => {
            const regime = selectedCam.regime;
            const api = apiResultRef.current;

            // The analyze call is one-shot — once we have a result for this
            // ROI, hold it for the lifetime of the ROI. The 1.3s tick still
            // runs so the displayed numbers visibly drift (live-feel jitter
            // on a fixed snapshot) and tracks age in/out naturally.
            let r: ReturnType<typeof tickPINN>;
            let targetCount: number;
            if (api) {
                const a = tickFromApi(prevVRef.current, api.result);
                prevVRef.current = a.v_now;
                r = a;
                targetCount = a.targetCount;
            } else {
                r = tickPINN(prevVRef.current, regime);
                prevVRef.current = r.v_now;
                targetCount = regime.logCount;
                // Honest empty state on `clear` regime — sometimes show no
                // detections so the panel doesn't invent cars on an empty road.
                if (regime.severity === 'clear' && Math.random() < 0.45) targetCount = 0;
            }

            // Update tracked vehicles toward the target count. Each existing
            // track has a chance to drop per tick; new tracks fill the gap.
            const now = new Date();
            tracksRef.current = tracksRef.current.filter(() => Math.random() > 0.30);
            // Cap at 4 visible entries (the panel only shows 4 anyway).
            const visibleTarget = Math.min(targetCount, 4);
            while (tracksRef.current.length < visibleTarget) {
                tracksRef.current.push({
                    id: nextIdRef.current++,
                    type: VEHICLE_TYPES[Math.floor(Math.random() * VEHICLE_TYPES.length)],
                    firstSeen: now,
                });
            }
            // Trim if we're over (e.g. target dropped from 4 to 1).
            if (tracksRef.current.length > visibleTarget) {
                tracksRef.current = tracksRef.current.slice(0, visibleTarget);
            }

            const logs = tracksRef.current.map((t) => ({
                id: t.id,
                type: t.type,
                speed: Math.max(0, prevVRef.current + (Math.random() * 8 - 4)).toFixed(1),
                conf: (0.85 + Math.random() * 0.14).toFixed(2),
                time: t.firstSeen.toISOString().split('T')[1].slice(0, 8),
            }));

            setTelemetry({
                flow: r.flow,
                density: r.density,
                avgSpeed: r.avgSpeed,
                trend: r.trend,
                recSpeed: r.recSpeed,
                congestionWidth: r.congestionWidth,
                severity: r.severity,
                logs,
            });
        };

        tick();
        const interval = setInterval(tick, 1300);
        return () => clearInterval(interval);
        // visionOnline intentionally not in deps — the tick reads apiResultRef
        // directly; adding visionOnline would rebuild the interval on every
        // status flip and reset the sim cadence.
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <section id="interactive-lab" className="pt-16 pb-24 md:pt-20 md:pb-28 bg-brand-charcoal relative overflow-hidden">
            <div className="container mx-auto px-6 max-w-7xl">
                
                <div className="text-center mb-16 relative z-10">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${isNightTime ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'} border`}>
                            {isNightTime ? <Moon className="w-4 h-4" /> : <Radio className="w-4 h-4 animate-pulse" />}
                            <span className="text-xs font-bold tracking-widest uppercase">
                                {isNightTime ? 'Pre-recorded Daytime Feed' : 'Live Network Feed'}
                            </span>
                        </div>
                        <button 
                            onClick={() => setForceNightMode(!forceNightMode)}
                            className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-white/30 hover:text-white/80 bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors"
                            title="Toggle Night Mode (Shift+N)"
                        >
                            Test Night
                        </button>
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
                                <div className={`w-2 h-2 rounded-full ${isNightTime ? 'bg-indigo-500' : 'bg-red-500 animate-pulse'}`}></div>
                                <span className="text-[10px] font-bold text-white tracking-wider uppercase">
                                    {isNightTime ? 'Recorded' : 'Live'}
                                </span>
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
                                <HlsPlayer src={isNightTime && cam.preRecordedUrl ? cam.preRecordedUrl : cam.url} />
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
                                <HlsPlayer src={isNightTime && selectedCam?.preRecordedUrl ? selectedCam.preRecordedUrl : (selectedCam?.url || '')} />
                                
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
                                
                                {/* Live AI Badge — flips between real CV and simulation fallback */}
                                <div className={`absolute top-6 right-6 z-40 flex items-center gap-1.5 px-3 py-1.5 backdrop-blur-md rounded border ${visionOnline ? 'bg-brand-cyan/10 border-brand-cyan/30' : 'bg-white/5 border-white/20'}`}>
                                    <div className={`w-2 h-2 rounded-full animate-pulse ${visionOnline ? 'bg-brand-cyan' : 'bg-white/40'}`}></div>
                                    <span className={`text-[10px] font-bold tracking-widest uppercase ${visionOnline ? 'text-brand-cyan' : 'text-white/60'}`}>
                                        {visionOnline ? 'Live AI Vision' : 'Simulation Mode'}
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
                        </motion.div>
                    </React.Fragment>
                )}
            </AnimatePresence>
        </section>
    );
};

export default InteractiveLabV2;
