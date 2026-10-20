// @vitest-environment jsdom
//
// T02: with the LIVE_DOT_CAMERAS flag off (the default build), the homepage
// camera slot must not play DOT video or contact a DOT host. It shows the
// labelled simulation instead, and the camera map shows locations only.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { LIVE_DOT_CAMERAS } from "@/lib/featureFlags";
import { LIVE_CAMERAS } from "@/lib/liveCameras";
import LiveCameras from "./LiveFeed";
import CameraLocationsMap from "@/components/CameraLocationsMap";

let fetchSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchSpy = vi.fn(() => Promise.reject(new Error("no network in tests")));
  vi.stubGlobal("fetch", fetchSpy);
  // jsdom has no canvas; the simulation bails out cleanly without a context.
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("live DOT camera flag", () => {
  it("is off unless the build sets VITE_LIVE_DOT_CAMERAS=true", () => {
    expect(LIVE_DOT_CAMERAS).toBe(false);
  });

  it("homepage camera slot shows the labelled simulation, not DOT video", () => {
    const { container } = render(<LiveCameras />);
    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText(/Simulation · not live data/)).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();
    // hls.js is only needed for DOT streams; it must not be injected.
    expect(document.querySelector('script[src*="hls"]')).toBeNull();
  });

  it("camera map shows every camera as a dot and no image", () => {
    const { container } = render(<CameraLocationsMap cameras={LIVE_CAMERAS} activeId={LIVE_CAMERAS[0].id} />);
    expect(container.querySelectorAll("[data-camera]")).toHaveLength(LIVE_CAMERAS.length);
    expect(container.querySelector("image, img, video")).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
