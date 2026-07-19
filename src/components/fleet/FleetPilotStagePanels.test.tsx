// @vitest-environment jsdom
//
// Component tests for the fleet-dashboard pilot stage panels. The load-bearing
// logic here is FleetPilotStageContent: a single status -> panel router with
// seven branches plus a null fallback. Each lifecycle status must render its
// own heading/copy, and a couple of cross-cutting rules (the ops message only
// shows when non-blank; the application summary collapses to nothing when every
// field is empty; the onboarding checklist names the FMS when known) ride on
// top. These render in isolation behind only a MemoryRouter for their <Link>s.
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import {
  FleetPilotStageContent,
  FleetLoiCard,
  FleetNoApplicationPanel,
} from "./FleetPilotStagePanels";
import type { PilotApplicationRow, PilotLifecycleStatus } from "@/lib/pilotApplication";

afterEach(() => cleanup());

// PilotApplicationRow has many required fields; this factory fills them all with
// inert defaults so individual tests only specify the field under test.
function makeApp(overrides: Partial<PilotApplicationRow> = {}): PilotApplicationRow {
  return {
    id: "app-1",
    user_id: "user-1",
    company_name: "Acme Freight",
    truck_size: "Class 8",
    fleet_size: "120",
    status: "pending",
    website: null,
    primary_lanes: null,
    fms_provider: null,
    fms_other: null,
    contact_name: null,
    contact_email: null,
    contact_phone: null,
    contact_title: null,
    application_notes: null,
    fleet_visible_message: null,
    notes: null,
    created_at: "2026-01-01T00:00:00Z",
    reviewed_at: null,
    ...overrides,
  };
}

function renderStage(
  status: PilotLifecycleStatus,
  app: PilotApplicationRow | null = null,
  loi: Parameters<typeof FleetPilotStageContent>[0]["loi"] = null,
) {
  return render(
    <MemoryRouter>
      <FleetPilotStageContent status={status} app={app} loi={loi} />
    </MemoryRouter>,
  );
}

describe("FleetPilotStageContent — one heading per lifecycle status", () => {
  // The exact buyer-facing heading each status must show. A copy change here is
  // intentional and should require touching this table; a status routing to the
  // wrong panel will fail.
  const cases: Array<[PilotLifecycleStatus, string]> = [
    ["pending", "Application received"],
    ["in_review", "Application under review"],
    ["approved", "Pilot deployment approved"],
    ["onboarding", "Onboarding in progress"],
    ["active", "Pilot active"],
    ["denied", "Not selected for this cohort"],
    ["archived", "Application archived"],
  ];

  it.each(cases)("renders the %s panel with its own heading", (status, heading) => {
    renderStage(status, makeApp({ status }));
    expect(screen.getByText(heading)).toBeTruthy();
  });

  it("distinguishes pending from in_review by sub-copy", () => {
    const { unmount } = renderStage("pending", makeApp({ status: "pending" }));
    expect(screen.getByText(/typically begin review within two business days/i)).toBeTruthy();
    unmount();
    renderStage("in_review", makeApp({ status: "in_review" }));
    expect(screen.getByText(/reviewing your fleet profile and signed LOI/i)).toBeTruthy();
  });

  it("renders nothing for an unrecognized status (null fallback)", () => {
    // Cast through unknown: the union forbids this value, but the component's
    // final `return null` is a real branch worth pinning against future statuses
    // being added without a panel.
    const { container } = renderStage("frozen" as PilotLifecycleStatus, makeApp());
    expect(container.textContent?.trim()).toBe("");
  });
});

describe("FleetPilotStageContent — ops message gating", () => {
  it("shows the Message from Cruze block when fleet_visible_message is set", () => {
    renderStage("pending", makeApp({ fleet_visible_message: "Welcome aboard, talk soon." }));
    expect(screen.getByText("Message from Cruze")).toBeTruthy();
    expect(screen.getByText("Welcome aboard, talk soon.")).toBeTruthy();
  });

  it("hides the ops block when the message is only whitespace", () => {
    // opsMessage = fleet_visible_message?.trim() — a blank/whitespace value must
    // not render an empty card.
    renderStage("pending", makeApp({ fleet_visible_message: "   \n  " }));
    expect(screen.queryByText("Message from Cruze")).toBeNull();
  });
});

describe("FleetPilotStageContent — application summary", () => {
  it("shows the application summary fields for a pending app", () => {
    renderStage("pending", makeApp({ company_name: "Acme Freight", fleet_size: "120" }));
    expect(screen.getByText("Your application")).toBeTruthy();
    expect(screen.getByText("Acme Freight")).toBeTruthy();
    expect(screen.getByText("120")).toBeTruthy();
  });

  it("combines fms_provider with fms_other when both are present", () => {
    renderStage("pending", makeApp({ fms_provider: "Other", fms_other: "HomegrownTMS" }));
    expect(screen.getByText("Other (HomegrownTMS)")).toBeTruthy();
  });

  it("collapses the summary to nothing when every field is empty", () => {
    // ApplicationSummary returns null when rows.length === 0 after filtering
    // falsy values — so a blank app must not render an empty 'Your application'.
    renderStage(
      "pending",
      makeApp({ company_name: null, fleet_size: null, truck_size: null, fms_provider: null }),
    );
    expect(screen.queryByText("Your application")).toBeNull();
  });

  it("does not render the application summary on the active panel", () => {
    // The active branch intentionally drops ApplicationSummary (only the ops
    // message + live-impact card). Pin that so a refactor can't reintroduce it.
    renderStage("active", makeApp({ company_name: "Acme Freight" }));
    expect(screen.getByText("Pilot active")).toBeTruthy();
    expect(screen.queryByText("Your application")).toBeNull();
  });
});

describe("FleetPilotStageContent — branch-specific details", () => {
  it("names the FMS provider in the onboarding checklist when known", () => {
    renderStage("onboarding", makeApp({ status: "onboarding", fms_provider: "Samsara" }));
    expect(screen.getByText(/Read-only Samsara access provisioned/i)).toBeTruthy();
  });

  it("uses the generic telematics step when no FMS provider is known", () => {
    renderStage("onboarding", makeApp({ status: "onboarding", fms_provider: null }));
    expect(screen.getByText(/Telematics \/ FMS read access provisioned/i)).toBeTruthy();
  });

  it("shows the contact email in the pending confirmation when present", () => {
    renderStage("pending", makeApp({ contact_email: "ops@acme.com" }));
    expect(screen.getByText(/ops@acme.com/)).toBeTruthy();
  });

  it("falls back to a generic address phrase when no contact email is on file", () => {
    renderStage("pending", makeApp({ contact_email: null }));
    expect(screen.getByText(/the address on your account/i)).toBeTruthy();
  });

  it("offers a re-apply path on the denied panel", () => {
    renderStage("denied", makeApp({ status: "denied" }));
    const link = screen.getByRole("link", { name: /submit a new application/i });
    expect(link.getAttribute("href")).toBe("/apply");
  });
});

describe("FleetLoiCard", () => {
  it("renders the company, a formatted signed date and a download link", () => {
    render(
      <MemoryRouter>
        <FleetLoiCard loi={{ id: "loi-9", signed_at: "2026-03-15T12:00:00Z", participant_company: "Acme Freight" }} />
      </MemoryRouter>,
    );
    expect(screen.getByText("Your signed Letter of Intent")).toBeTruthy();
    // Date is rendered via toLocaleDateString("en-US", {year,month:'short',day}).
    expect(screen.getByText(/Acme Freight · signed Mar 15, 2026/)).toBeTruthy();
    const link = screen.getByRole("link", { name: /view \/ download/i });
    expect(link.getAttribute("href")).toBe("/loi/loi-9");
  });
});

describe("FleetNoApplicationPanel", () => {
  it("prompts a new application with a link to /apply", () => {
    render(
      <MemoryRouter>
        <FleetNoApplicationPanel />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Start your Cruze pilot application/i)).toBeTruthy();
    const link = screen.getByRole("link", { name: /apply for the pilot/i });
    expect(link.getAttribute("href")).toBe("/apply");
  });
});
