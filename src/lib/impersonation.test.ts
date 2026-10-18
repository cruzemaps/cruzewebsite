// @vitest-environment jsdom
//
// A non-admin cannot impersonate. The /impersonate handoff only enters the
// preview after the start_impersonation RPC (migration 017) accepts the caller
// as an active admin and writes the audit row, and it previews the role the
// server returned, never the one in the URL. Production builds never start it.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { beginImpersonation, impersonationUrl, type StartImpersonationRpc } from "./impersonation";
import { getDemoRole, getImpersonatedUserId } from "./demoMode";

const TARGET = "3f2b8c1e-4d5a-4b6c-8e7f-9a0b1c2d3e4f";

const denyingRpc = () =>
  vi.fn<StartImpersonationRpc>(async () => ({
    data: null,
    error: { message: "start_impersonation: caller is not an active admin" },
  }));

beforeEach(() => vi.stubEnv("DEV", true));
afterEach(() => {
  vi.unstubAllEnvs();
  sessionStorage.clear();
});

describe("beginImpersonation", () => {
  it("denies a non-admin when the server refuses, and writes nothing", async () => {
    const rpc = denyingRpc();
    const out = await beginImpersonation(`?id=${TARGET}`, rpc);

    expect(rpc).toHaveBeenCalledWith("start_impersonation", { target_user_id: TARGET });
    expect(out.kind).toBe("denied");
    expect(sessionStorage.length).toBe(0);
  });

  it("ignores role, status and go in the URL: a crafted admin link still needs the server", async () => {
    const rpc = denyingRpc();
    const out = await beginImpersonation(`?role=admin&status=active&id=${TARGET}&go=/admin`, rpc);

    expect(out.kind).toBe("denied");
    expect(getDemoRole()).toBeNull();
  });

  it("previews the role the server returned after it audited the session", async () => {
    const rpc = vi.fn<StartImpersonationRpc>(async () => ({
      data: [{ role: "fleet_owner", status: "approved" }],
      error: null,
    }));
    const out = await beginImpersonation(`?id=${TARGET}&role=admin`, rpc);

    expect(out).toEqual({ kind: "redirect", to: "/fleet-dashboard" });
    expect(getDemoRole()).toBe("fleet_owner");
    expect(getImpersonatedUserId()).toBe(TARGET);
  });

  it("denies when the server is unreachable", async () => {
    const rpc = vi.fn<StartImpersonationRpc>(async () => {
      throw new Error("network");
    });
    const out = await beginImpersonation(`?id=${TARGET}`, rpc);
    expect(out.kind).toBe("denied");
    expect(sessionStorage.length).toBe(0);
  });

  it("rejects a malformed id without calling the server", async () => {
    const rpc = denyingRpc();
    const out = await beginImpersonation("?id=not-a-uuid", rpc);
    expect(out).toEqual({ kind: "redirect", to: "/admin" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("does nothing in a production build, even for an admin", async () => {
    vi.stubEnv("DEV", false);
    const rpc = vi.fn<StartImpersonationRpc>(async () => ({ data: [{ role: "admin", status: "active" }], error: null }));
    const out = await beginImpersonation(`?id=${TARGET}`, rpc);

    expect(out).toEqual({ kind: "redirect", to: "/" });
    expect(rpc).not.toHaveBeenCalled();
    expect(sessionStorage.length).toBe(0);
  });

  it("puts only the target id in the handoff URL", () => {
    expect(impersonationUrl(TARGET)).toBe(`/impersonate?id=${TARGET}`);
  });
});
