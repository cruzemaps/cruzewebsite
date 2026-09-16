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
// `window.Hls`, and drive the effect with renderHook. The >60s token-expiry
// boundary is controlled by spying Date.now(); the SRI test uses fake timers so
// the 8s CDN stall guard can't leak a real timer into later tests.
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
  const video = document.createElement("video");
  // jsdom doesn't implement media playback; the hook calls video.play() and
  // chains .catch() on the promise it returns.
  video.play = vi.fn(() => Promise.resolve());
  (ref as { current: HTMLVideoElement }).current = video;
  return ref;
}

// Minimal stand-in for the CDN-loaded hls.js global. The hook only uses
// isSupported/Events + an instance's loadSource/attachMedia/on/destroy. We
// capture the registered event handlers so a test can fire MANIFEST_PARSED /
// ERROR synchronously, and count instances (a token-expiry restart makes a
// second one).
function installMockHls() {
  const handlers: Record<string, (a: unknown, b: unknown) => void> = {};
  const instances: unknown[] = [];
  class MockHls {
    static isSupported() {
      return true;
    }
    static Events = { MANIFEST_PARSED: "manifestParsed", ERROR: "error" };
    loadSource = vi.fn();
    attachMedia = vi.fn();
    destroy = vi.fn();
    on = vi.fn((evt: string, cb: (a: unknown, b: unknown) => void) => {
      handlers[evt] = cb;
    });
    constructor() {
      instances.push(this);
    }
  }
  (window as unknown as { Hls: unknown }).Hls = MockHls;
  return {
    handlers,
    get instanceCount() {
      return instances.length;
    },
    fireFatalError() {
      handlers[MockHls.Events.ERROR]?.(null, { fatal: true });
    },
    fireManifestParsed() {
      handlers[MockHls.Events.MANIFEST_PARSED]?.(null, null);
    },
  };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
  // Reset the module-level hls.js loader singleton + any injected globals so
  // each test starts from a cold CDN-load state.
  delete (window as unknown as { Hls?: unknown }).Hls;
  document.body.querySelectorAll("script").forEach((s) => s.remove());
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
    // This is the one test that drives the real CDN-load path (no window.Hls),
    // which arms an 8s stall-guard setTimeout. jsdom never fires the script's
    // onload/onerror, so use fake timers to flush microtasks and then clear the
    // pending timer rather than leaking a real 8s timer into later tests.
    vi.useFakeTimers();
    try {
      resolveStreamUrl.mockResolvedValue("https://stream.example/live.m3u8");
      renderHook(() => useHlsCamera(videoRef(), "cam-1", vi.fn(), vi.fn()));

      // Let start() settle its awaited promises (resolveStreamUrl, loadHlsJs)
      // so the CDN <script> gets appended. Microtasks resolve independently of
      // fake timers, so a few flushes suffice.
      for (let i = 0; i < 5; i++) await vi.advanceTimersByTimeAsync(0);

      const script = document.body.querySelector<HTMLScriptElement>(
        `script[src="${PINNED_SRC}"]`
      );
      expect(script).not.toBeNull();
      // Never `@latest`: pinned exact version in the URL.
      expect(script!.src).toContain("hls.js@1.5.20");
      expect(script!.src).not.toContain("@latest");
      // SRI + CORS pin — dropping either reopens the CDN-compromise hole.
      expect(script!.integrity).toMatch(/^sha384-/);
      expect(script!.crossOrigin).toBe("anonymous");
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
    }
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

  it("fires onLive when the manifest parses (happy path)", async () => {
    resolveStreamUrl.mockResolvedValue("https://stream.example/live.m3u8");
    const hls = installMockHls();
    const onLive = vi.fn();
    renderHook(() => useHlsCamera(videoRef(), "cam-1", onLive, vi.fn()));

    await waitFor(() => expect(hls.instanceCount).toBe(1));
    expect(onLive).not.toHaveBeenCalled(); // not until the manifest parses
    hls.fireManifestParsed();
    expect(onLive).toHaveBeenCalledTimes(1);
  });

  it("re-resolves a fresh URL on a fatal error long after start (token expiry)", async () => {
    let now = 1_000_000;
    vi.spyOn(Date, "now").mockImplementation(() => now);
    resolveStreamUrl.mockResolvedValue("https://stream.example/live.m3u8");
    const hls = installMockHls();
    const onFail = vi.fn();
    renderHook(() => useHlsCamera(videoRef(), "cam-1", vi.fn(), onFail));

    await waitFor(() => expect(hls.instanceCount).toBe(1));
    expect(resolveStreamUrl).toHaveBeenCalledTimes(1);

    // >60s later a fatal error is almost certainly an expired ~15-min token:
    // the hook restarts with a fresh URL rather than giving up.
    now += 61_000;
    hls.fireFatalError();
    await waitFor(() => expect(resolveStreamUrl).toHaveBeenCalledTimes(2));
    expect(onFail).not.toHaveBeenCalled();
  });

  it("reports onFail on a fatal error right after start (camera down)", async () => {
    let now = 1_000_000;
    vi.spyOn(Date, "now").mockImplementation(() => now);
    resolveStreamUrl.mockResolvedValue("https://stream.example/live.m3u8");
    const hls = installMockHls();
    const onFail = vi.fn();
    renderHook(() => useHlsCamera(videoRef(), "cam-1", vi.fn(), onFail));

    await waitFor(() => expect(hls.instanceCount).toBe(1));

    // A fatal error within 60s of start means the camera is actually down.
    now += 5_000;
    hls.fireFatalError();
    expect(onFail).toHaveBeenCalledTimes(1);
    expect(resolveStreamUrl).toHaveBeenCalledTimes(1); // no re-resolve
  });
});
