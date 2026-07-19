import { describe, it, expect } from "vitest";
import {
  renderLOIText,
  suggestInitials,
  LOI_VERSION,
  LOI_SUMMARY_BULLETS,
  PERFORMANCE_FEE_MIN_PCT,
  PERFORMANCE_FEE_MAX_PCT,
  type LOIFields,
} from "./loi";

const baseFields: LOIFields = {
  participantName: "Sam Patel",
  participantCompany: "Coastal Transport",
  fleetSize: "30",
  signedDate: "2026-06-21",
  initials: "SP",
};

describe("renderLOIText", () => {
  it("fills in every required participant placeholder", () => {
    const text = renderLOIText(baseFields);
    expect(text).toContain("Coastal Transport (The Participant)");
    expect(text).toContain("For The Participant: Sam Patel");
    expect(text).toContain("30 vehicles shall be enrolled");
    expect(text).toContain("Initials: SP");
    expect(text).toContain("Signed (electronic): 2026-06-21");
  });

  it("includes the performance-fee range from the shared constants", () => {
    const text = renderLOIText(baseFields);
    expect(text).toContain(
      `${PERFORMANCE_FEE_MIN_PCT}–${PERFORMANCE_FEE_MAX_PCT}%`
    );
  });

  it("omits the participant title line when no title is given", () => {
    const text = renderLOIText(baseFields);
    // Only the provider's own "Title: Founder" line should remain.
    const titleLines = text.match(/Title: /g) ?? [];
    expect(titleLines).toHaveLength(1);
    expect(text).toContain("Title: Founder");
  });

  it("renders a participant title line when a title is provided", () => {
    const text = renderLOIText({ ...baseFields, participantTitle: "Ops Director" });
    expect(text).toContain("Title: Ops Director");
    const titleLines = text.match(/Title: /g) ?? [];
    expect(titleLines).toHaveLength(2);
  });

  it("always names Cruze as the non-participant party", () => {
    const text = renderLOIText(baseFields);
    expect(text).toContain("Cruzemaps (The Provider)");
    expect(text).toContain("For Cruze: Anudeep Bonagiri");
  });

  it("keeps the LOI explicitly non-binding", () => {
    expect(renderLOIText(baseFields)).toContain("non-binding");
  });
});

describe("suggestInitials", () => {
  it("takes the first letter of each word, uppercased", () => {
    expect(suggestInitials("Sam Patel")).toBe("SP");
    expect(suggestInitials("maria del rio")).toBe("MDR");
  });

  it("trims and collapses extra whitespace", () => {
    expect(suggestInitials("  Sam   Patel  ")).toBe("SP");
  });

  it("caps the result at 4 characters", () => {
    expect(suggestInitials("a b c d e f")).toBe("ABCD");
  });

  it("returns an empty string for an empty or whitespace-only name", () => {
    expect(suggestInitials("")).toBe("");
    expect(suggestInitials("   ")).toBe("");
  });

  it("handles a single name", () => {
    expect(suggestInitials("Cher")).toBe("C");
  });
});

describe("LOI constants", () => {
  it("has a semantic-looking version string", () => {
    expect(LOI_VERSION).toMatch(/^\d+\.\d+$/);
  });

  it("keeps the fee range ordered and within 0-100%", () => {
    expect(PERFORMANCE_FEE_MIN_PCT).toBeLessThan(PERFORMANCE_FEE_MAX_PCT);
    expect(PERFORMANCE_FEE_MIN_PCT).toBeGreaterThanOrEqual(0);
    expect(PERFORMANCE_FEE_MAX_PCT).toBeLessThanOrEqual(100);
  });

  it("summary bullets reflect the same fee range as the constants", () => {
    const joined = LOI_SUMMARY_BULLETS.join(" ");
    expect(joined).toContain(
      `${PERFORMANCE_FEE_MIN_PCT}–${PERFORMANCE_FEE_MAX_PCT}%`
    );
  });
});
