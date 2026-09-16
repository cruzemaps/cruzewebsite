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

let hlsLoader: Promise<any> | null = null;

// A CDN load can end three ways: it loads, it errors synchronously, or it
// stalls (the browser's TCP timeout can take 30-120s). The stall guard
// resolves null after 8s so players fall over instead of hanging on a black
// frame. A failed load resets the singleton so a later retry re-attempts.
function loadHlsJs(): Promise<any> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if ((window as any).Hls) return Promise.resolve((window as any).Hls);
  if (!hlsLoader) {
    hlsLoader = new Promise((resolve) => {
      let settled = false;
      const settle = (v: any) => {
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
      script.onload = () => settle((window as any).Hls ?? null);
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
    let hls: any = null;
    let cancelled = false;
    let startedAt = 0;
    // Each start() bumps this. A restart resets startedAt and then awaits
    // resolveStreamUrl + loadHlsJs before it destroys the old, still-attached
    // hls.js instance — so that instance can emit a *second* fatal error during
    // the async window, when Date.now()-startedAt ~= 0 would misread token
    // expiry as camera-down and defeat the recovery in flight. Handlers capture
    // the generation they were registered under and no-op once superseded.
    let generation = 0;

    const fail = () => {
      if (!cancelled) cb.current.onFail();
    };

    // A fatal error long after start is almost certainly token expiry —
    // restart with a fresh token. A fatal error right after start means the
    // camera is actually down. A fatal error from a superseded attempt (gen
    // mismatch) is a straggler from the old instance and is ignored.
    const onFatal = (gen: number) => {
      if (cancelled || gen !== generation) return;
      if (Date.now() - startedAt > 60_000) start();
      else fail();
    };

    const start = async () => {
      const gen = ++generation;
      startedAt = Date.now();
      const url = await resolveStreamUrl(cameraId);
      if (cancelled || gen !== generation) return;
      if (!url) return fail();
      const Hls = await loadHlsJs();
      if (cancelled || gen !== generation) return;

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
          if (!cancelled && gen === generation) {
            cb.current.onLive();
            video.play().catch(() => {});
          }
        });
        hls.on(Hls.Events.ERROR, (_: any, data: any) => {
          if (data.fatal) onFatal(gen);
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
        video.addEventListener(
          "loadedmetadata",
          () => {
            if (!cancelled && gen === generation) {
              cb.current.onLive();
              video.play().catch(() => {});
            }
          },
          { once: true }
        );
        video.addEventListener("error", () => onFatal(gen), { once: true });
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
