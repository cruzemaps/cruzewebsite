import { describe, it, expect } from "vitest";
import {
  PILOT_LIFECYCLE,
  TERMINAL_PILOT_STATUSES,
  PILOT_STATUS_LABELS,
  pilotInsertFromWizard,
  type ApplyWizardPayload,
} from "./pilotApplication";

const fullPayload: ApplyWizardPayload = {
  companyName: "Coastal Transport",
  website: "https://coastal.example",
  fleetSize: "120",
  truckSize: "Class 8",
  primaryLanes: "I-35 SA-Laredo",
  fmsProvider: "Samsara",
  fmsOther: "",
  contactEmail: "ops@coastal.example",
  contactName: "Sam Patel",
  contactPhone: "210-555-0100",
  contactTitle: "Ops Director",
  notes: "Petroleum tankers",
};

describe("pilotInsertFromWizard", () => {
  it("maps the core wizard fields onto the DB row shape", () => {
    const row = pilotInsertFromWizard("user-123", fullPayload);
    expect(row.user_id).toBe("user-123");
    expect(row.company_name).toBe("Coastal Transport");
    expect(row.truck_size).toBe("Class 8");
    expect(row.fleet_size).toBe("120");
    expect(row.contact_name).toBe("Sam Patel");
    expect(row.contact_email).toBe("ops@coastal.example");
    expect(row.application_notes).toBe("Petroleum tankers");
  });

  it("always inserts as 'pending'", () => {
    expect(pilotInsertFromWizard("u", fullPayload).status).toBe("pending");
  });

  it("coerces empty optional strings to null", () => {
    const sparse: ApplyWizardPayload = {
      ...fullPayload,
      website: "",
      primaryLanes: "",
      contactPhone: "",
      contactTitle: "",
      notes: "",
    };
    const row = pilotInsertFromWizard("u", sparse);
    expect(row.website).toBeNull();
    expect(row.primary_lanes).toBeNull();
    expect(row.contact_phone).toBeNull();
    expect(row.contact_title).toBeNull();
    expect(row.application_notes).toBeNull();
  });

  it("only records fms_other when the provider is exactly 'Other'", () => {
    const namedProvider = pilotInsertFromWizard("u", {
      ...fullPayload,
      fmsProvider: "Samsara",
      fmsOther: "ShouldBeIgnored",
    });
    expect(namedProvider.fms_provider).toBe("Samsara");
    expect(namedProvider.fms_other).toBeNull();

    const otherProvider = pilotInsertFromWizard("u", {
      ...fullPayload,
      fmsProvider: "Other",
      fmsOther: "HomegrownTMS",
    });
    expect(otherProvider.fms_provider).toBe("Other");
    expect(otherProvider.fms_other).toBe("HomegrownTMS");
  });

  it("nulls fms_other when provider is 'Other' but no name was typed", () => {
    const row = pilotInsertFromWizard("u", {
      ...fullPayload,
      fmsProvider: "Other",
      fmsOther: "",
    });
    expect(row.fms_other).toBeNull();
  });
});

describe("pilot lifecycle metadata", () => {
  it("treats only denied/archived as terminal, and both are real statuses", () => {
    expect(TERMINAL_PILOT_STATUSES).toContain("denied");
    expect(TERMINAL_PILOT_STATUSES).toContain("archived");
    for (const s of TERMINAL_PILOT_STATUSES) {
      expect(PILOT_LIFECYCLE).toContain(s);
    }
  });

  it("has a human label for every lifecycle status (no missing/extra keys)", () => {
    const labelKeys = Object.keys(PILOT_STATUS_LABELS).sort();
    const lifecycle = [...PILOT_LIFECYCLE].sort();
    expect(labelKeys).toEqual(lifecycle);
    for (const label of Object.values(PILOT_STATUS_LABELS)) {
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate lifecycle statuses", () => {
    expect(new Set(PILOT_LIFECYCLE).size).toBe(PILOT_LIFECYCLE.length);
  });
});
