// @vitest-environment jsdom
//
// The demo path cannot read real fleet rows.
//   1. Production: a planted demo_role key does not create a session. The auth
//      provider runs the real Supabase flow, so with no Supabase login there is
//      no user and the fleet dashboard is unreachable.
//   2. Dev: the demo fleet dashboard renders mock data and never queries
//      Supabase (no pilot_applications, no loi_signatures, no realtime).
// Real rows are only ever read with the browser's real Supabase JWT, under RLS.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const sb = vi.hoisted(() => ({
  from: vi.fn(),
  channel: vi.fn(),
  removeChannel: vi.fn(),
  getSession: vi.fn(async () => ({ data: { session: null } })),
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: sb.from,
    channel: sb.channel,
    removeChannel: sb.removeChannel,
    auth: { getSession: sb.getSession, onAuthStateChange: sb.onAuthStateChange, signOut: vi.fn() },
  },
}));
vi.mock("@/lib/analytics", () => ({ identifyUser: vi.fn(), resetAnalytics: vi.fn(), track: vi.fn() }));

import { AuthProvider } from "@/hooks/AuthProvider";
import { useAuth } from "@/hooks/useAuth";
import FleetDashboard from "./FleetDashboard";

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  sessionStorage.clear();
});

function Probe() {
  const { user, role, loading } = useAuth();
  if (loading) return <p>loading</p>;
  return <p>user={user ? user.id : "none"} role={role ?? "none"}</p>;
}

describe("demo path and real fleet data", () => {
  it("production: a planted demo_role does not mint a session", async () => {
    vi.stubEnv("DEV", false);
    sessionStorage.setItem("demo_role", "fleet_owner");

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    expect(await screen.findByText("user=none role=none")).toBeTruthy();
    expect(sb.getSession).toHaveBeenCalled();
  });

  it("dev: the demo fleet dashboard renders mock data without querying Supabase", async () => {
    vi.stubEnv("DEV", true);
    sessionStorage.setItem("demo_role", "fleet_owner");
    sessionStorage.setItem("demo_status", "pending");

    render(
      <AuthProvider>
        <MemoryRouter>
          <FleetDashboard />
        </MemoryRouter>
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.queryByText("Loading…")).toBeNull());
    expect(screen.getAllByText("Demo Fleet").length).toBeGreaterThan(0);
    expect(sb.getSession).not.toHaveBeenCalled();
    expect(sb.from).not.toHaveBeenCalled();
    expect(sb.channel).not.toHaveBeenCalled();
  });
});
