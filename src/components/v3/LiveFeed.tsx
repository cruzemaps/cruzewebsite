import { useEffect, useRef } from "react";

// Reusable live TxDOT HLS player. Same feed list and fallback behaviour as the
// /cameras page, extracted so the redesigned homepage can show a real, moving
// highway feed instead of an abstract animation. Falls back to the recorded
// clip when a public DOT stream is down (which happens, outside our control).
const FALLBACK_MP4 = "/cruze-web.mp4";

export type Feed = {
  id: number;
  city: string;
  location: string;
  url: string;
};

export const FEEDS: Feed[] = [
  { id: 3, city: "Austin", location: "IH-35", url: "https://s70.us-east-1.skyvdn.com:443/rtplive/TX_AUS_263/playlist.m3u8" },
  { id: 1, city: "Dallas", location: "IH-635", url: "https://s70.us-east-1.skyvdn.com:443/rtplive/TX_DAL_001/playlist.m3u8" },
  { id: 2, city: "Houston", location: "IH-45", url: "https://s70.us-east-1.skyvdn.com:443/rtplive/TX_HOU_1002/playlist.m3u8" },
  { id: 4, city: "San Antonio", location: "IH-10", url: "https://s70.us-east-1.skyvdn.com:443/rtplive/TX_AUS_262/playlist.m3u8" },
];

export default function LiveFeed({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const state: { hls: any; cancelled: boolean } = { hls: null, cancelled: false };

    const loadFallback = () => {
      const video = videoRef.current;
      if (!video || state.cancelled) return;
      if (state.hls) { state.hls.destroy(); state.hls = null; }
      video.src = FALLBACK_MP4;
      video.loop = true;
      video.play().catch(() => {});
    };

    const init = () => {
      if (state.cancelled) return;
      const video = videoRef.current;
      if (!video) return;

      if (src.endsWith(".mp4")) {
        video.src = src;
        video.loop = true;
        video.play().catch(() => {});
        return;
      }

      const Hls = (window as any).Hls;
      if (Hls && Hls.isSupported()) {
        state.hls = new Hls({
          maxBufferLength: 10,
          manifestLoadingTimeOut: 8000,
          manifestLoadingMaxRetry: 2,
          levelLoadingTimeOut: 8000,
          levelLoadingMaxRetry: 2,
        });
        state.hls.loadSource(src);
        state.hls.attachMedia(video);
        state.hls.on(Hls.Events.MANIFEST_PARSED, () => { if (!state.cancelled) video.play().catch(() => {}); });
        state.hls.on(Hls.Events.ERROR, (_: any, data: any) => { if (data.fatal) loadFallback(); });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        video.addEventListener("loadedmetadata", () => { if (!state.cancelled) video.play().catch(() => {}); });
        video.addEventListener("error", loadFallback, { once: true });
      } else {
        loadFallback();
      }
    };

    if (typeof window !== "undefined" && !(window as any).Hls) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";
      script.async = true;
      script.onload = init;
      document.body.appendChild(script);
    } else {
      init();
    }

    return () => {
      state.cancelled = true;
      if (state.hls) { state.hls.destroy(); state.hls = null; }
    };
  }, [src]);

  return <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />;
}
