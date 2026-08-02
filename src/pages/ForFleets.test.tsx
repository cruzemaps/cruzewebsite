// @vitest-environment jsdom
//
// Component tests for the two logic-bearing sections of the /for-fleets page:
//   - ROISection      — the fleet ROI calculator. The headline savings numbers
//                       are customer-facing, so a silent change to a constant
//                       (e.g. the 11% fuel-reduction factor) must break a test.
//   - ComparisonStrip — the Cruze-vs-incumbents capability matrix, where each
//                       boolean maps to a ✓/· glyph in a specific column.
// Both are mounted in isolation (wrapped only in a MemoryRouter for their
// <Link>s) rather than through the full MarketingLayout, which would pull in
// Navbar -> useAuth -> Supabase.
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ROISection, ComparisonStrip } from "./ForFleets";

afterEach(() => cleanup());

// --- ROISection -----------------------------------------------------------

// Independent re-implementation of the calculator formula. It pins every
// constant the component uses, so if ROISection's math drifts (a changed
// percentage, a dropped term, a rounding tweak) the expectations below diverge
// and the test fails. Mirrors the component's exact rounding: each displayed
// figure is rounded, but the headline total rounds the SUM of the *unrounded*
// fuel + labor + CSA/safety dollars.
function expected(inputs: {
  trucks: number;
  milesPerTruckYear: number;
  mpg: number;
  fuelPrice: number;
  driverHourly: number;
  crashRatePerMM: number;
  costPerCrash: number;
}) {
  const { trucks, milesPerTruckYear, mpg, fuelPrice, driverHourly, crashRatePerMM, costPerCrash } = inputs;
  const annualMiles = trucks * milesPerTruckYear;
  const annualGallons = annualMiles / Math.max(mpg, 1);
  const fuelSaved = annualGallons * 0.11; // 11% fuel reduction
  const fuelSavingsUSD = fuelSaved * fuelPrice;
  const hoursReclaimedYear = trucks * 1.5 * 50; // 1.5 hrs/week * 50 weeks
  const laborValueUSD = hoursReclaimedYear * driverHourly;
  const co2Tons = (fuelSaved * 10.21) / 1000; // ~10.21 kg CO2 / gallon diesel
  // CSA / safety savings: a 15% reduction applied only to the ~25%
  // congestion-related (rear-end / sudden-stop) subset of recordable crashes.
  const baselineCrashes = (annualMiles / 1_000_000) * crashRatePerMM;
  const crashesAvoided = baselineCrashes * 0.25 * 0.15;
  const csaSavingsUSD = crashesAvoided * costPerCrash;
  return {
    fuel: Math.round(fuelSavingsUSD),
    labor: Math.round(laborValueUSD),
    csa: Math.round(csaSavingsUSD),
    total: Math.round(fuelSavingsUSD + laborValueUSD + csaSavingsUSD),
    co2: Math.round(co2Tons),
    hours: Math.round(hoursReclaimedYear),
  };
}

const DEFAULTS = {
  trucks: 50,
  milesPerTruckYear: 80000,
  mpg: 6.5,
  fuelPrice: 3.85,
  driverHourly: 28,
  crashRatePerMM: 0.3,
  costPerCrash: 90000,
};

function renderROI() {
  return render(
    <MemoryRouter>
      <ROISection />
    </MemoryRouter>,
  );
}

// ResultRow renders <div>{label}</div> immediately followed by <div>{value}</div>
// as siblings, so the value is the label node's next element sibling.
function rowValue(label: string): string {
  const labelEl = screen.getByText(label);
  return labelEl.nextElementSibling?.textContent ?? "";
}

describe("ROISection (fleet ROI calculator)", () => {
  it("renders the headline total for the default 50-truck fleet (golden value)", () => {
    renderROI();
    // Hand-derived from the defaults (fuel $260,615 + labor $105,000 + CSA
    // $4,050); guards against the formula helper and the component sharing a
    // silent bug.
    expect(screen.getByText("$369,665")).toBeTruthy();
  });

  it("matches the independent formula for every default output row", () => {
    renderROI();
    const e = expected(DEFAULTS);
    expect(rowValue("Fuel saved")).toBe(`$${e.fuel.toLocaleString()}`);
    expect(rowValue("Driver-hours value")).toBe(`$${e.labor.toLocaleString()}`);
    expect(rowValue("CSA / safety savings")).toBe(`$${e.csa.toLocaleString()}`);
    expect(rowValue("CO₂ avoided")).toBe(`${e.co2.toLocaleString()} t`);
    expect(rowValue("Hours reclaimed")).toBe(`${e.hours.toLocaleString()} hr/yr`);
  });

  it("renders the default golden figures explicitly", () => {
    renderROI();
    expect(rowValue("Fuel saved")).toBe("$260,615");
    expect(rowValue("Driver-hours value")).toBe("$105,000");
    expect(rowValue("CSA / safety savings")).toBe("$4,050");
    expect(rowValue("CO₂ avoided")).toBe("691 t");
    expect(rowValue("Hours reclaimed")).toBe("3,750 hr/yr");
  });

  it("labels the total with the current truck count", () => {
    renderROI();
    expect(screen.getByText("across 50 trucks")).toBeTruthy();
  });

  it("exposes exactly two numeric inputs (fuel price, driver $/hr) seeded from defaults", () => {
    renderROI();
    expect(screen.getByDisplayValue("3.85")).toBeTruthy(); // fuel price
    expect(screen.getByDisplayValue("28")).toBeTruthy(); // driver hourly
  });

  it("recomputes fuel saved and the total when the fuel price changes", () => {
    renderROI();
    const fuelInput = screen.getByDisplayValue("3.85");
    fireEvent.change(fuelInput, { target: { value: "5" } });
    // Hardcoded golden values for fuelPrice=5 (independent of the formula
    // helper, so a shared-formula bug on this code path is still caught):
    //   fuelSaved 67,692.31 gal * $5 = $338,461.54 -> $338,462
    //   total = round(338,461.54 + 105,000 + 4,050 CSA) = $447,512
    expect(rowValue("Fuel saved")).toBe("$338,462");
    // labor and CSA/safety are independent of fuel price, so they must stay put
    expect(rowValue("Driver-hours value")).toBe("$105,000");
    expect(screen.getByText("$447,512")).toBeTruthy();
    // cross-check against the independent formula helper
    expect(expected({ ...DEFAULTS, fuelPrice: 5 })).toMatchObject({ fuel: 338462, total: 447512 });
  });

  it("recomputes driver-hours value and the total when the hourly rate changes", () => {
    renderROI();
    const rateInput = screen.getByDisplayValue("28");
    fireEvent.change(rateInput, { target: { value: "40" } });
    // Hardcoded golden values for driverHourly=40:
    //   labor 3,750 hr * $40 = $150,000
    //   total = round(260,615.38 + 150,000 + 4,050 CSA) = $414,665
    expect(rowValue("Driver-hours value")).toBe("$150,000");
    // fuel and CSA/safety are independent of the hourly rate
    expect(rowValue("Fuel saved")).toBe("$260,615");
    expect(screen.getByText("$414,665")).toBeTruthy();
    expect(expected({ ...DEFAULTS, driverHourly: 40 })).toMatchObject({ labor: 150000, total: 414665 });
  });

  it("treats a cleared fuel-price input as 0 (parseFloat NaN -> 0 fallback)", () => {
    renderROI();
    const fuelInput = screen.getByDisplayValue("3.85");
    fireEvent.change(fuelInput, { target: { value: "" } });
    // fuelPrice 0 -> fuel savings $0; labor is unaffected
    expect(rowValue("Fuel saved")).toBe("$0");
    expect(rowValue("Driver-hours value")).toBe("$105,000");
  });

  it("treats a non-numeric hourly rate as 0", () => {
    renderROI();
    const rateInput = screen.getByDisplayValue("28");
    fireEvent.change(rateInput, { target: { value: "abc" } });
    expect(rowValue("Driver-hours value")).toBe("$0");
  });

  it("leaves CO₂ and hours-reclaimed unchanged by a price-only edit (they ignore $ inputs)", () => {
    renderROI();
    fireEvent.change(screen.getByDisplayValue("3.85"), { target: { value: "5" } });
    fireEvent.change(screen.getByDisplayValue("28"), { target: { value: "40" } });
    expect(rowValue("CO₂ avoided")).toBe("691 t");
    expect(rowValue("Hours reclaimed")).toBe("3,750 hr/yr");
  });
});

// --- ComparisonStrip ------------------------------------------------------

const FEATURES = [
  { feature: "Routes around traffic", cruze: true, others: true },
  { feature: "Predicts congestion", cruze: true, others: true },
  { feature: "Coordinates driver speeds with the swarm", cruze: true, others: false },
  { feature: "Dissolves phantom jams before they form", cruze: true, others: false },
  { feature: "Audit-grade CO₂ ledger", cruze: true, others: false },
  { feature: "Works without new hardware", cruze: true, others: false },
];

const CHECK = "✓";
const DASH = "·";

// Returns the [cruze, others] cell glyphs for a given capability row.
function rowGlyphs(feature: string): { cruze: string; others: string } {
  const cell = screen.getByText(feature);
  const tr = cell.closest("tr") as HTMLTableRowElement;
  const tds = tr.querySelectorAll("td");
  return { cruze: tds[1].textContent ?? "", others: tds[2].textContent ?? "" };
}

describe("ComparisonStrip", () => {
  it("renders the three column headers", () => {
    render(<ComparisonStrip />);
    expect(screen.getByText("Capability")).toBeTruthy();
    expect(screen.getByText("Cruze")).toBeTruthy();
    expect(screen.getByText("Others")).toBeTruthy();
  });

  it("renders exactly one body row per capability", () => {
    const { container } = render(<ComparisonStrip />);
    const bodyRows = container.querySelectorAll("tbody tr");
    expect(bodyRows.length).toBe(FEATURES.length);
  });

  it("lists every capability feature", () => {
    render(<ComparisonStrip />);
    for (const { feature } of FEATURES) {
      expect(screen.getByText(feature)).toBeTruthy();
    }
  });

  it("marks Cruze as supporting every capability", () => {
    render(<ComparisonStrip />);
    for (const { feature } of FEATURES) {
      expect(rowGlyphs(feature).cruze).toBe(CHECK);
    }
  });

  it("maps each row's `others` boolean to the correct glyph", () => {
    render(<ComparisonStrip />);
    for (const { feature, others } of FEATURES) {
      expect(rowGlyphs(feature).others).toBe(others ? CHECK : DASH);
    }
  });

  it("shows the four differentiators as Cruze-only (others get a dash)", () => {
    render(<ComparisonStrip />);
    const differentiators = FEATURES.filter((f) => !f.others).map((f) => f.feature);
    expect(differentiators.length).toBe(4);
    for (const feature of differentiators) {
      const { cruze, others } = rowGlyphs(feature);
      expect(cruze).toBe(CHECK);
      expect(others).toBe(DASH);
    }
  });

  it("shows table-stakes capabilities (routing, prediction) for both columns", () => {
    render(<ComparisonStrip />);
    for (const feature of ["Routes around traffic", "Predicts congestion"]) {
      const { cruze, others } = rowGlyphs(feature);
      expect(cruze).toBe(CHECK);
      expect(others).toBe(CHECK);
    }
  });

  it("names the incumbent competitors in the heading", () => {
    const { container } = render(<ComparisonStrip />);
    const heading = within(container).getByText(/Cruze vs/i).closest("h2");
    expect(heading?.textContent).toContain("Geotab");
    expect(heading?.textContent).toContain("Samsara");
    expect(heading?.textContent).toContain("Motive");
  });
});
