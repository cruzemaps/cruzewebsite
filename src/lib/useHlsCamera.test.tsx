// @vitest-environment jsdom
//
// Tests for useHlsCamera, the shared live-TxDOT-camera playback hook (homepage
// LiveFeed + /cameras). This file had zero coverage despite CLAUDE.md flagging
// two load-bearing, security-relevant behaviours in it:
//
//   1. The hls.js CDN load is PINNED at 1.5.20 with an SRI hash and
//      crossorigin=anonymous — a shipped security fix. Loading `@latest` or
//      dropping the integrity attr would let a compromised CDN publish run
//      arbitrary JS on the live site. Test `injects the pinned, SRI-guarded
//      script` guards that regression directly.
//   2. Token-expiry recovery: a fatal hls.js error >60s after start is treated
//      as an expired ~15-min stream token and re-resolves a fresh URL; a fatal
//      error inside 60s means the camera is down and reports onFail.
//
// The hook drives real DOM (a <video>, an injected <script>) and hls.js is
// loaded from a CDN at runtime, so we mock `resolveStreamUrl`, stub a minimal
// `window.Hls`, and drive the effect with renderHook + fake timers.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, cleanup, waitFor } from "@testing-library/react";
import { createRef } from "react";

// resolveStreamUrl hits DriveTexas's tokened camera API — mock it so tests are
// hermetic and we control the resolved URL (or a null "camera offline").
const resolveStreamUrl = vi.fn<(id: string) => Promise<string | null>>();
vi.mock("@/lib/liveCameras", () => ({
  resolveStreamUrl: (id: string) => resolveStreamUrl(id),
}));

import { useHlsCamera } from "./useHlsCamera";

// The pinned CDN coordinates the hook must never drift off (see module header).
const PINNED_SRC =
  "https://cdn.jsdelivr.net/npm/hls.js@1.5.20/dist/hls.min.js";

// A ref pointing at a real <video>, as the hook's callers provide.
function videoRef() {
  const ref = createRef<HTMLVideoElement>();
  (ref as { current: HTMLVideoElement }).current =
    document.createElement("video");
  return ref;
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  // Reset the module-level hls.js loader singleton + any injected globals so
  // each test starts from a cold CDN-load state.
  delete (window as unknown as { Hls?: unknown }).Hls;
  document.body.querySelectorAll("script").forEach((s) => s.remove());
  vi.resetModules();
});

describe("useHlsCamera", () => {
  it("does nothing when cameraId is null (lazy gate / offline)", () => {
    resolveStreamUrl.mockResolvedValue("https://stream.example/live.m3u8");
    const onLive = vi.fn();
    const onFail = vi.fn();
    renderHook(() => useHlsCamera(videoRef(), null, onLive, onFail));
    expect(resolveStreamUrl).not.toHaveBeenCalled();
    expect(onLive).not.toHaveBeenCalled();
    expect(onFail).not.toHaveBeenCalled();
  });

  it("injects the pinned, SRI-guarded hls.js script (security regression guard)", async () => {
    resolveStreamUrl.mockResolvedValue("https://stream.example/live.m3u8");
    renderHook(() => useHlsCamera(videoRef(), "cam-1", vi.fn(), vi.fn()));

    // The effect resolves the URL then injects the CDN <script>. Wait for it.
    await waitFor(() => {
      const script = document.body.querySelector<HTMLScriptElement>(
        `script[src="${PINNED_SRC}"]`
      );
      expect(script).not.toBeNull();
    });

    const script = document.body.querySelector<HTMLScriptElement>(
      `script[src="${PINNED_SRC}"]`
    )!;
    // Never `@latest`: pinned exact version in the URL.
    expect(script.src).toContain("hls.js@1.5.20");
    expect(script.src).not.toContain("@latest");
    // SRI + CORS pin — dropping either reopens the CDN-compromise hole.
    expect(script.integrity).toMatch(/^sha384-/);
    expect(script.crossOrigin).toBe("anonymous");
  });

  it("reports onFail (not onLive) when the stream URL cannot be resolved", async () => {
    resolveStreamUrl.mockResolvedValue(null); // camera offline / no token
    const onLive = vi.fn();
    const onFail = vi.fn();
    renderHook(() => useHlsCamera(videoRef(), "cam-1", onLive, onFail));

    await waitFor(() => expect(onFail).toHaveBeenCalledTimes(1));
    expect(onLive).not.toHaveBeenCalled();
    // No CDN script should have been injected — we bailed before loading hls.js.
    expect(document.body.querySelector(`script[src="${PINNED_SRC}"]`)).toBeNull();
  });
});
