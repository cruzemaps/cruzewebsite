import { useEffect, useRef, useState } from "react";

// Live in-browser vehicle detection overlay. Loads COCO-SSD via TensorFlow.js
// (~5MB weights, cached after first load), runs inference on the live video
// frame at ~3 FPS, and renders bounding boxes around detected vehicles as
// proof the AI is "seeing" the road in real time. Inference happens entirely
// client-side — no per-frame API cost.
//
// This overlay also drives the telemetry panel via an `onDetections`
// callback — the parent uses the live box list to compute density / count /
// regime severity, so the side panel reflects what's actually in the frame.
//
// If the ROI is drawn, boxes inside the polygon are highlighted by class
// color and boxes outside are dimmed so the user can see which vehicles
// count toward their selection.

export type Box = {
    cls: "car" | "truck" | "bus" | "motorcycle" | "bicycle";
    x: number; // 0-100 percent
    y: number;
    w: number;
    h: number;
    conf: number;
};

const VEHICLE_CLASSES = new Set(["car", "truck", "bus", "motorcycle", "bicycle"]);

// Color palette per class so the overlay reads clearly. Cyan for cars to
// match the brand accent; warmer tones for the rarer classes.
const CLASS_COLOR: Record<Box["cls"], string> = {
    car: "#00F2FF",
    truck: "#FF8C00",
    bus: "#FFB75E",
    motorcycle: "#A78BFA",
    bicycle: "#34D399",
};

// Detection runs on this cadence. ~330ms strikes a balance between visible
// box update rate and CPU/GPU load on the client. Tighter (~150ms) and the
// fan kicks on; looser (~600ms) and the boxes feel laggy.
const DETECT_INTERVAL_MS = 330;

type Props = {
    // Getter so we can resolve the <video> after it mounts inside HlsPlayer.
    // The element doesn't exist on first paint, so we poll briefly until it
    // appears rather than depending on a prop that won't re-trigger.
    getVideo: () => HTMLVideoElement | null;
    enabled: boolean;
    // ROI polygon in 0-100% space. When provided + closed, boxes outside the
    // polygon are dimmed so the user sees which vehicles are "in" their pick.
    roiPoints?: { x: number; y: number }[];
    roiActive?: boolean;
    // Fires every detection tick with the latest boxes. Parent uses this
    // to drive the telemetry panel.
    onDetections?: (boxes: Box[]) => void;
    // Fires once when the model finishes loading. Parent uses this to swap
    // a "Detector initializing" badge for a "Detector active" one.
    onReady?: () => void;
};

export default function YoloOverlay({ getVideo, enabled, roiPoints = [], roiActive = false, onDetections, onReady }: Props) {
    const [boxes, setBoxes] = useState<Box[]>([]);
    const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
    const [video, setVideo] = useState<HTMLVideoElement | null>(null);
    // Human-readable failure detail surfaced to the UI so we don't go silent
    // when the model can't load, the WebGL backend won't init, or detect()
    // throws on the video pixels. The previous version silently returned null.
    const [errorDetail, setErrorDetail] = useState<string>("");
    // Elapsed time + stage so the loading state shows progress instead of
    // looking frozen during the multi-second TFJS + weights download.
    const [loadStage, setLoadStage] = useState<string>("Fetching detector code…");
    const loadStartRef = useRef<number>(Date.now());
    const [, forceTick] = useState(0);
    const modelRef = useRef<unknown>(null);
    const runningRef = useRef(false);
    // Log the raw predictions ONCE per camera session so the console shows
    // what coco-ssd is actually returning (class + score), even when they
    // get filtered out by the confidence threshold below. Reset when the
    // detection effect tears down.
    const loggedSample = useRef(false);
    // Visible debug: most-recent raw stats so users can see why nothing is
    // being drawn without opening DevTools.
    const [debug, setDebug] = useState<{ total: number; passing: number; topClass: string; topScore: number }>({
        total: 0, passing: 0, topClass: "—", topScore: 0,
    });

    // While loading, update a 0.5s heartbeat so the elapsed-seconds display
    // ticks live. Stops once status flips to ready or error.
    useEffect(() => {
        if (status !== "loading") return;
        const id = setInterval(() => forceTick((n) => n + 1), 500);
        return () => clearInterval(id);
    }, [status]);

    // Poll for the video element on mount until it appears, then stop. The
    // modal animates in over ~300ms and HlsPlayer mounts its <video> inside
    // that animation, so a strict prop-passed ref would race.
    useEffect(() => {
        if (!enabled) {
            setVideo(null);
            return;
        }
        let stop = false;
        let attempts = 0;
        const find = () => {
            if (stop) return;
            const v = getVideo();
            if (v) {
                setVideo(v);
                return;
            }
            attempts += 1;
            if (attempts < 50) setTimeout(find, 100); // 5s max wait
        };
        find();
        return () => { stop = true; };
    }, [enabled, getVideo]);

    // Lazy-load the model once. The wrappers are dynamic-imported so the TFJS
    // runtime (~1MB) isn't pulled into every page bundle — only when the lab
    // page actually mounts.
    useEffect(() => {
        if (!enabled) return;
        let cancelled = false;
        loadStartRef.current = Date.now();
        setLoadStage("Fetching detector code…");

        (async () => {
            try {
                console.info("[YoloOverlay] Loading TensorFlow.js + coco-ssd…");
                const [tf, cocoSsd] = await Promise.all([
                    import("@tensorflow/tfjs"),
                    import("@tensorflow-models/coco-ssd"),
                ]);
                if (cancelled) return;
                setLoadStage("Initializing WebGL backend…");
                await tf.ready();
                if (cancelled) return;
                console.info(`[YoloOverlay] tf.ready done in ${Date.now() - loadStartRef.current}ms, backend: ${tf.getBackend()}`);
                setLoadStage("Downloading model weights (~5MB)…");
                // `lite_mobilenet_v2` is the smallest variant (~5MB) and
                // adequate for vehicle counting on a 320×240 traffic-cam
                // frame. Heavier variants would barely help at this resolution.
                const model = await cocoSsd.load({ base: "lite_mobilenet_v2" });
                if (cancelled) return;
                modelRef.current = model;
                console.info(`[YoloOverlay] Model ready in ${Date.now() - loadStartRef.current}ms`);
                setStatus("ready");
                onReady?.();
            } catch (err) {
                if (!cancelled) {
                    console.error("[YoloOverlay] Model load failed:", err);
                    setErrorDetail(`Model load failed: ${String((err as Error)?.message || err).slice(0, 200)}`);
                    setStatus("error");
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [enabled]);

    // Detection loop. Runs while model is ready and video is playable. Uses
    // a recursive setTimeout (not setInterval) so a slow detect call doesn't
    // pile up — each frame only fires after the previous finishes.
    useEffect(() => {
        if (status !== "ready" || !enabled || !video) return;

        let stop = false;

        const tick = async () => {
            if (stop) return;
            const model = modelRef.current as {
                detect: (
                    v: HTMLVideoElement,
                    maxNumBoxes?: number,
                    minScore?: number,
                ) => Promise<Array<{ bbox: [number, number, number, number]; class: string; score: number }>>;
            } | null;
            if (!model || runningRef.current || video.readyState < 2 || !video.videoWidth) {
                setTimeout(tick, DETECT_INTERVAL_MS);
                return;
            }
            runningRef.current = true;
            try {
                // model.detect lets us request up to 24 detections at a lower
                // score cap. The defaults (20 max, 0.5 cap) drop tiny / blurry
                // traffic-cam vehicles entirely. Passing both as arguments
                // makes the model return more candidates and we filter them
                // ourselves below.
                const preds = await model.detect(video, 24, 0.02);
                if (stop) return;
                if (!loggedSample.current) {
                    loggedSample.current = true;
                    console.info(
                        `[YoloOverlay] First detect returned ${preds.length} predictions on ${video.videoWidth}×${video.videoHeight} video. Sample:`,
                        preds.slice(0, 6).map((p) => ({ cls: p.class, score: p.score.toFixed(2) })),
                    );
                }
                const vw = video.videoWidth;
                const vh = video.videoHeight;
                // 0.10 is the practical floor for COCO-SSD lite on small,
                // grainy traffic-cam frames — cars at distance routinely
                // score 0.10-0.35. Raised back if we see false positives.
                const SCORE_FLOOR = 0.10;
                const next: Box[] = preds
                    .filter((p) => VEHICLE_CLASSES.has(p.class) && p.score >= SCORE_FLOOR)
                    .slice(0, 24)
                    .map((p) => ({
                        cls: p.class as Box["cls"],
                        x: (p.bbox[0] / vw) * 100,
                        y: (p.bbox[1] / vh) * 100,
                        w: (p.bbox[2] / vw) * 100,
                        h: (p.bbox[3] / vh) * 100,
                        conf: p.score,
                    }));
                setBoxes(next);
                onDetections?.(next);
                // Update the visible debug stats so the user can see exactly
                // what the model returned without opening DevTools. Useful
                // for tuning SCORE_FLOOR against the live feed.
                const top = preds.length
                    ? preds.reduce((a, b) => (a.score > b.score ? a : b))
                    : null;
                setDebug({
                    total: preds.length,
                    passing: next.length,
                    topClass: top?.class ?? "—",
                    topScore: top ? top.score : 0,
                });
            } catch (err) {
                // The most common error here is a cross-origin video that
                // hasn't been tagged with crossOrigin="anonymous". We log
                // once and stop the loop — re-enable when the user picks a
                // different cam.
                console.error("[YoloOverlay] Detect failed:", err);
                setErrorDetail(`Detection failed: ${String((err as Error)?.message || err).slice(0, 200)}`);
                stop = true;
                setStatus("error");
            } finally {
                runningRef.current = false;
                if (!stop) setTimeout(tick, DETECT_INTERVAL_MS);
            }
        };

        tick();
        return () => {
            stop = true;
        };
    }, [status, enabled, video]);

    if (!enabled) return null;

    const roiClosed = roiActive && roiPoints.length >= 3;
    const roiPolyString = roiClosed
        ? roiPoints.map((p) => `${p.x},${p.y}`).join(" ")
        : "";
    const elapsed = Math.floor((Date.now() - loadStartRef.current) / 1000);

    return (
        <div className="absolute inset-0 pointer-events-none z-25">
            {status === "loading" && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-5 py-3 bg-black/75 backdrop-blur rounded-xl border border-white/20 text-center max-w-sm">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="text-[11px] font-bold tracking-widest uppercase text-white">
                            Initializing detector
                        </span>
                    </div>
                    <div className="text-[10px] text-white/60 font-mono">
                        {loadStage} · {elapsed}s
                    </div>
                </div>
            )}
            {status === "error" && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-5 py-3 bg-red-500/15 backdrop-blur rounded-xl border border-red-500/40 text-center max-w-md">
                    <div className="text-[11px] font-bold tracking-widest uppercase text-red-300 mb-1">
                        Detector unavailable
                    </div>
                    <div className="text-[10px] text-red-200/80 font-mono break-words">
                        {errorDetail || "Unknown error — see console"}
                    </div>
                </div>
            )}
            <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full"
            >
                {roiClosed && (
                    // Punch a hole so the ROI region is "lit" and the rest is
                    // very faintly darkened — gives the YOLO boxes outside the
                    // polygon a muted look without obscuring the video itself.
                    <defs>
                        <mask id="roi-spotlight">
                            <rect x="0" y="0" width="100" height="100" fill="white" opacity="0.35" />
                            <polygon points={roiPolyString} fill="white" />
                        </mask>
                    </defs>
                )}
                {boxes.map((b, i) => {
                    const inRoi = roiClosed ? pointInPolygon(b.x + b.w / 2, b.y + b.h / 2, roiPoints) : true;
                    const color = inRoi ? CLASS_COLOR[b.cls] : "#6B7280";
                    const opacity = inRoi ? 0.95 : 0.4;
                    // Stroke widths are in viewBox units (0-100 scale). At 1.0
                    // that's ~1% of the video width — visible but not heavy.
                    // The previous version used 0.35 with non-scaling-stroke
                    // which resolved to 0.35 CSS pixels (sub-pixel, invisible).
                    return (
                        <g key={i} opacity={opacity}>
                            <rect
                                x={b.x}
                                y={b.y}
                                width={b.w}
                                height={b.h}
                                fill={color}
                                fillOpacity={0.12}
                                stroke={color}
                                strokeWidth={0.6}
                            />
                            <rect
                                x={b.x}
                                y={Math.max(0, b.y - 4)}
                                width={Math.max(12, b.cls.length * 2.4 + 4)}
                                height={4}
                                fill={color}
                                opacity={0.95}
                            />
                            <text
                                x={b.x + 1}
                                y={Math.max(3, b.y - 1)}
                                fontSize="3"
                                fontFamily="ui-monospace, monospace"
                                fontWeight="700"
                                fill="#0B0E14"
                            >
                                {b.cls} {b.conf.toFixed(2)}
                            </text>
                        </g>
                    );
                })}
            </svg>
            {/* Detector status + raw stats so you can see what's happening
                without opening DevTools. If "passing" is 0 while "raw" is
                non-zero, the score floor is too high for this stream. If
                "raw" is also 0, the model isn't producing any output (likely
                a video/canvas readability issue). */}
            {status === "ready" && (
                <div className="absolute bottom-6 right-6 flex flex-col gap-1 px-3 py-2 bg-black/75 backdrop-blur rounded-lg border border-white/15 font-mono">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-bold text-emerald-300 tracking-widest uppercase">
                            Detector · {boxes.length} drawn
                        </span>
                    </div>
                    <div className="text-[9px] text-white/55">
                        raw {debug.total} · passing {debug.passing} · top {debug.topClass}:{debug.topScore.toFixed(2)}
                    </div>
                </div>
            )}
        </div>
    );
}

// Point-in-polygon test for the ROI dim/highlight logic. Polygon is in 0-100
// percent space; (x, y) is the bbox center. Standard ray-cast algorithm.
function pointInPolygon(x: number, y: number, polygon: { x: number; y: number }[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;
        const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-9) + xi;
        if (intersect) inside = !inside;
    }
    return inside;
}
