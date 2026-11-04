// `cn` is used in nearly every component to build className strings, so the one
// behavior worth pinning is tailwind-merge's conflict resolution: when two
// utilities touch the same CSS property, the later one must win. These tests
// guard against a tailwind-merge upgrade (or a swap away from it) silently
// changing how component class overrides resolve.
import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("lets a later utility override an earlier one on the same property", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-sm", "text-lg")).toBe("text-lg");
  });

  it("keeps utilities that touch different properties", () => {
    expect(cn("px-4", "font-bold")).toBe("px-4 font-bold");
  });

  it("drops falsy and conditional inputs", () => {
    expect(cn("px-4", false, null, undefined, "")).toBe("px-4");
    expect(cn("px-4", { "font-bold": true, hidden: false })).toBe(
      "px-4 font-bold",
    );
  });

  it("flattens array inputs", () => {
    expect(cn(["px-4", "font-bold"])).toBe("px-4 font-bold");
  });

  it("resolves conflicts across conditional and array inputs too", () => {
    expect(cn(["px-2"], { "px-4": true })).toBe("px-4");
  });

  it("returns an empty string when given no usable classes", () => {
    expect(cn()).toBe("");
    expect(cn(false, null, undefined)).toBe("");
  });
});
