import { useEffect, useRef, type RefObject } from "react";
import { resolveStreamUrl } from "@/lib/liveCameras";

// Shared HLS playback for the live TxDOT cameras (homepage LiveFeed and
// /cameras). Resolves the tokened stream URL at play time (see
// src/lib/liveCameras.ts), plays it with hls.js (or native HLS on Safari),
// and re-resolves once on a fatal error — stream tokens expire after ~15
// minutes, so a long-running viewer recovers with a fresh token instead of
// dying. A second quick failure reports onFail so the caller can fail over.

// Pinned version + SRI: never load `@latest` — a compromised or breaking
// CDN publish would execute arbitrary JS on the live site.
const HLS_SRC = "https://cdn.jsdelivr.net/npm/hls.js@1.5.20/dist/hls.min.js";
const HLS_SRI = "sha384-V5ruNBgmYcC3SJRUQeNykAAAgde5gOFq/Hu0CZj7bygDP0yRIhkvX8+w0u/7mRvr";

// hls.js is loaded from a CDN at runtime (not bundled), so its own types
// aren't available. Type only the surface this hook touches, structurally.
// Event payloads vary by event; we only read `fatal` (on ERROR). Other
// fields are typed `unknown` so a future reader must narrow rather than
// silently inherit the error shape.
type HlsEventData = { fatal?: boolean; [key: string]: unknown };

interface HlsInstance {
  loadSource(url: string): void;
  attachMedia(media: HTMLMediaElement): void;
  on(event: string, cb: (event: string, data: HlsEventData) => void): void;
  destroy(): void;
}

interface HlsStatic {
  new (config?: Record<string, unknown>): HlsInstance;
  isSupported(): boolean;
  Events: { MANIFEST_PARSED: string; ERROR: string };
}

const hlsWindow = () =>
  window as unknown as { Hls?: HlsStatic };

let hlsLoader: Promise<HlsStatic | null> | null = null;

// A CDN load can end three ways: it loads, it errors synchronously, or it
// stalls (the browser's TCP timeout can take 30-120s). The stall guard
// resolves null after 8s so players fall over instead of hanging on a black
// frame. A failed load resets the singleton so a later retry re-attempts.
function loadHlsJs(): Promise<HlsStatic | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  const existing = hlsWindow().Hls;
  if (existing) return Promise.resolve(existing);
  if (!hlsLoader) {
    hlsLoader = new Promise<HlsStatic | null>((resolve) => {
      let settled = false;
      const settle = (v: HlsStatic | null) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (!v) hlsLoader = null;
        resolve(v);
      };
      const timer = setTimeout(() => settle(null), 8000);
      const script = document.createElement("script");
      script.src = HLS_SRC;
      script.integrity = HLS_SRI;
      script.crossOrigin = "anonymous";
      script.async = true;
      script.onload = () => settle(hlsWindow().Hls ?? null);
      script.onerror = () => settle(null);
      document.body.appendChild(script);
    });
  }
  return hlsLoader;
}

export function useHlsCamera(
  videoRef: RefObject<HTMLVideoElement>,
  cameraId: string | null, // null = don't play (lazy gate / offline)
  onLive: () => void,
  onFail: () => void
) {
  // Refs so the effect always calls the latest callbacks without re-running
  // on every render.
  const cb = useRef({ onLive, onFail });
  cb.current = { onLive, onFail };

  useEffect(() => {
    if (!cameraId) return;
    const video = videoRef.current;
    if (!video) return;
    let hls: HlsInstance | null = null;
    let cancelled = false;
    let startedAt = 0;

    const fail = () => {
      if (!cancelled) cb.current.onFail();
    };

    // A fatal error long after start is almost certainly token expiry —
    // restart with a fresh token. A fatal error right after start means the
    // camera is actually down.
    const onFatal = () => {
      if (cancelled) return;
      if (Date.now() - startedAt > 60_000) start();
      else fail();
    };

    const start = async () => {
      startedAt = Date.now();
      const url = await resolveStreamUrl(cameraId);
      if (cancelled) return;
      if (!url) return fail();
      const Hls = await loadHlsJs();
      if (cancelled) return;

      if (Hls && Hls.isSupported()) {
        if (hls) hls.destroy();
        hls = new Hls({
          maxBufferLength: 10,
          maxMaxBufferLength: 20,
          manifestLoadingTimeOut: 8000,
          manifestLoadingMaxRetry: 1,
          levelLoadingTimeOut: 8000,
          levelLoadingMaxRetry: 1,
          fragLoadingMaxRetry: 2,
        });
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (!cancelled) {
            cb.current.onLive();
            video.play().catch(() => {});
          }
        });
        hls.on(Hls.Events.ERROR, (_: string, data: HlsEventData) => {
          if (data.fatal) onFatal();
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
        video.addEventListener(
          "loadedmetadata",
          () => {
            if (!cancelled) {
              cb.current.onLive();
              video.play().catch(() => {});
            }
          },
          { once: true }
        );
        video.addEventListener("error", onFatal, { once: true });
      } else {
        fail();
      }
    };

    start();
    return () => {
      cancelled = true;
      if (hls) hls.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraId]);
}
