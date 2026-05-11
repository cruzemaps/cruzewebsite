// Cloudflare Worker: traffic-frame analyzer.
//
// POST /analyze
//   Body:    { frame: string }         // data URL or raw base64 (jpeg/png)
//   Returns: { ok: true, result: AnalysisResult } | { ok: false, error: string }
//
// The worker captures a single frame from the InteractiveLabV2 modal, asks
// Claude Haiku 4.5 vision to count vehicles + classify the traffic regime,
// and returns a clamped JSON result the SPA can drop into its telemetry.
//
// The ANTHROPIC_API_KEY is delivered via `wrangler secret put` — it must
// never appear in source files, in git, or in the client bundle.

interface Env {
    ANTHROPIC_API_KEY: string;
}

type Severity = "clear" | "stable" | "heavy" | "shock";

interface AnalysisResult {
    count: number;
    meanSpeedMph: number;
    density: number;
    severity: Severity;
    recommendedSpeedMph: number;
}

const ALLOWED_ORIGINS = new Set([
    "https://cruzemaps.com",
    "https://www.cruzemaps.com",
]);

// Any localhost / 127.0.0.1 port is allowed for dev convenience. Vite picks
// 8080 by default but auto-increments when busy (8081, 8082, ...).
const DEV_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function isAllowedOrigin(origin: string | null): boolean {
    if (!origin) return false;
    if (ALLOWED_ORIGINS.has(origin)) return true;
    if (DEV_ORIGIN_RE.test(origin)) return true;
    return false;
}

const SYSTEM_PROMPT = `You are analyzing a single still frame from a public Texas DOT traffic camera. The user has drawn a Region of Interest (ROI) polygon on the camera view, and pixels OUTSIDE that polygon have been masked to pure black before this image was sent to you. Only count and classify what is visible inside the non-black (lit) region. Black regions are intentional masks — they contain no traffic information and you must not infer vehicles from them.

Respond with a single JSON object — no prose, no markdown, no code fences.

JSON schema:
{
  "count": number,                       // vehicles visible inside the lit (non-black) region only (cars, trucks, buses, motorcycles). If the lit region is empty of vehicles, this MUST be 0.
  "meanSpeedMph": number,                // rough estimate of mean vehicle speed in mph for vehicles inside the lit region. If no vehicles visible, return 0.
  "density": number,                     // estimated vehicles per mile within the ROI. clear: 2-15, stable: 15-40, heavy: 40-90, shock/jam: 90-150.
  "severity": "clear" | "stable" | "heavy" | "shock",
                                          //   clear:  free flow, few or no vehicles, plenty of gaps
                                          //   stable: moderate density, smooth flow
                                          //   heavy:  high density, slowed flow
                                          //   shock:  stop-and-go shockwave / queue / jam
  "recommendedSpeedMph": number          // suggested variable speed limit (15-75), rounded to nearest 5 mph
}

Be honest about empty ROIs — if the lit region shows no vehicles, say count: 0 and severity: "clear". Do not fabricate vehicles. Do not count anything in the black-masked area. The lit pixels are the only ground truth.`;

const USER_TEXT = "Analyze this traffic camera frame. Respond with the JSON object only.";

const MODEL = "claude-haiku-4-5-20251001";

// Bound the request body. Anthropic accepts much larger images, but the SPA
// downsamples before posting and there's no reason to accept multi-MB blobs.
const MAX_FRAME_BYTES = 2_000_000;

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const origin = request.headers.get("Origin");
        const cors = corsHeaders(origin);

        if (request.method === "OPTIONS") {
            return new Response(null, { status: 204, headers: cors });
        }

        const url = new URL(request.url);
        if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
            return jsonResponse({ ok: true, service: "cruze-frame-analyze" }, 200, cors);
        }

        if (request.method !== "POST") {
            return jsonResponse({ ok: false, error: "POST /analyze only" }, 405, cors);
        }

        if (!env.ANTHROPIC_API_KEY) {
            return jsonResponse({ ok: false, error: "worker missing ANTHROPIC_API_KEY secret" }, 500, cors);
        }

        let body: { frame?: unknown };
        try {
            body = (await request.json()) as { frame?: unknown };
        } catch {
            return jsonResponse({ ok: false, error: "invalid JSON body" }, 400, cors);
        }

        if (typeof body.frame !== "string" || body.frame.length === 0) {
            return jsonResponse({ ok: false, error: "missing 'frame' (base64 string)" }, 400, cors);
        }

        const { data, mediaType } = splitDataUrl(body.frame);
        if (!data) {
            return jsonResponse({ ok: false, error: "frame is not base64 / data URL" }, 400, cors);
        }
        if (data.length > MAX_FRAME_BYTES) {
            return jsonResponse({ ok: false, error: "frame too large" }, 413, cors);
        }

        try {
            const upstream = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "x-api-key": env.ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    model: MODEL,
                    max_tokens: 256,
                    system: SYSTEM_PROMPT,
                    messages: [
                        {
                            role: "user",
                            content: [
                                {
                                    type: "image",
                                    source: { type: "base64", media_type: mediaType, data },
                                },
                                { type: "text", text: USER_TEXT },
                            ],
                        },
                    ],
                }),
            });

            if (!upstream.ok) {
                const text = await safeText(upstream);
                return jsonResponse(
                    { ok: false, error: `upstream ${upstream.status}`, detail: text.slice(0, 400) },
                    502,
                    cors,
                );
            }

            const payload = (await upstream.json()) as {
                content?: Array<{ type: string; text?: string }>;
            };
            const textContent = payload.content?.find((c) => c.type === "text")?.text;
            if (!textContent) {
                return jsonResponse({ ok: false, error: "no text content from model" }, 502, cors);
            }

            const parsed = tryParseJson(textContent);
            if (!parsed) {
                return jsonResponse(
                    { ok: false, error: "model output not parseable as JSON", raw: textContent.slice(0, 400) },
                    502,
                    cors,
                );
            }

            const result = normalizeResult(parsed);
            return jsonResponse({ ok: true, result }, 200, cors);
        } catch (err) {
            return jsonResponse({ ok: false, error: `worker error: ${String(err).slice(0, 200)}` }, 500, cors);
        }
    },
} satisfies ExportedHandler<Env>;

function corsHeaders(origin: string | null): Record<string, string> {
    const allowed = isAllowedOrigin(origin) ? (origin as string) : "https://cruzemaps.com";
    return {
        "Access-Control-Allow-Origin": allowed,
        "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
        Vary: "Origin",
    };
}

function jsonResponse(body: unknown, status: number, headers: Record<string, string>): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...headers, "Content-Type": "application/json" },
    });
}

function splitDataUrl(input: string): { data: string; mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" } {
    if (input.startsWith("data:")) {
        const comma = input.indexOf(",");
        const meta = input.slice(5, comma);
        const semi = meta.indexOf(";");
        const rawType = semi === -1 ? meta : meta.slice(0, semi);
        const mediaType = normalizeMediaType(rawType);
        return { data: input.slice(comma + 1), mediaType };
    }
    return { data: input, mediaType: "image/jpeg" };
}

function normalizeMediaType(t: string): "image/jpeg" | "image/png" | "image/webp" | "image/gif" {
    switch (t) {
        case "image/png":
        case "image/webp":
        case "image/gif":
            return t;
        default:
            return "image/jpeg";
    }
}

function tryParseJson(text: string): Record<string, unknown> | null {
    // Tolerate stray code fences or surrounding prose by extracting the first
    // {...} block.
    const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    try {
        return JSON.parse(cleaned) as Record<string, unknown>;
    } catch {
        const start = cleaned.indexOf("{");
        const end = cleaned.lastIndexOf("}");
        if (start === -1 || end === -1 || end <= start) return null;
        try {
            return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
        } catch {
            return null;
        }
    }
}

function normalizeResult(parsed: Record<string, unknown>): AnalysisResult {
    const sevRaw = String(parsed.severity ?? "").toLowerCase();
    const severity: Severity = (["clear", "stable", "heavy", "shock"] as const).includes(sevRaw as Severity)
        ? (sevRaw as Severity)
        : "stable";

    const count = clamp(toNum(parsed.count), 0, 200);
    const recRounded = Math.round(clamp(toNum(parsed.recommendedSpeedMph), 15, 75) / 5) * 5;

    return {
        count,
        meanSpeedMph: clamp(toNum(parsed.meanSpeedMph), 0, 100),
        density: clamp(toNum(parsed.density), 0, 200),
        severity,
        recommendedSpeedMph: recRounded,
    };
}

function toNum(v: unknown): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

function clamp(n: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, n));
}

async function safeText(r: Response): Promise<string> {
    try {
        return await r.text();
    } catch {
        return "";
    }
}
