// @vitest-environment jsdom
//
// Tests for the Apply-wizard draft persistence layer. This module is the wizard's
// memory: it merges three sources (defaults < server draft < per-tab session
// draft) on load, debounces writes back to the server, and — security-relevant —
// must NEVER persist or restore the signed-LOI agreement/initials, so a draft
// can't silently re-assert a legal signature the user didn't re-make. jsdom gives
// us a real sessionStorage; Supabase RPC is mocked so no network/DB is touched.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
vi.mock("@/lib/supabase", () => ({ supabase: { rpc: (...a: unknown[]) => rpc(...a) } }));

import {
  loadSessionDraft,
  saveSessionDraft,
  clearSessionDraft,
  loadWizardDraft,
  scheduleDraftPersist,
  clearAllDrafts,
  type WizardDraft,
} from "./applyDraft";

const SESSION_KEY = "pending_application";

beforeEach(() => {
  sessionStorage.clear();
  rpc.mockReset();
  rpc.mockResolvedValue({ data: null, error: null });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("session draft round-trip", () => {
  it("saveSessionDraft then loadSessionDraft returns the same object", () => {
    const draft = { companyName: "Acme Freight", fleetSize: "200" } as WizardDraft;
    saveSessionDraft(draft);
    expect(loadSessionDraft()).toEqual(draft);
  });

  it("loadSessionDraft returns null when nothing is stored", () => {
    expect(loadSessionDraft()).toBeNull();
  });

  it("loadSessionDraft returns null (not throw) on corrupt JSON", () => {
    sessionStorage.setItem(SESSION_KEY, "{not valid json");
    expect(loadSessionDraft()).toBeNull();
  });

  it("clearSessionDraft removes the stored draft", () => {
    saveSessionDraft({ companyName: "Acme" } as WizardDraft);
    clearSessionDraft();
    expect(loadSessionDraft()).toBeNull();
  });
});

describe("loadWizardDraft merge precedence", () => {
  it("returns the empty defaults when there is no user and no session draft", async () => {
    const draft = await loadWizardDraft(undefined, undefined);
    expect(draft.companyName).toBe("");
    expect(draft.contactEmail).toBe("");
    expect(draft.loiAgreed).toBe(false);
    expect(draft.loiInitials).toBe("");
    expect(rpc).not.toHaveBeenCalled(); // no userId → no server read
  });

  it("seeds contactEmail from the signed-in user's email when no draft overrides it", async () => {
    const draft = await loadWizardDraft(undefined, "ops@acme.com");
    expect(draft.contactEmail).toBe("ops@acme.com");
  });

  it("merges the server draft over defaults for a signed-in user", async () => {
    rpc.mockResolvedValueOnce({ data: { companyName: "Server Co", fleetSize: "150" }, error: null });
    const draft = await loadWizardDraft("user-1", "ops@acme.com");
    expect(rpc).toHaveBeenCalledWith("get_pilot_draft");
    expect(draft.companyName).toBe("Server Co");
    expect(draft.fleetSize).toBe("150");
  });

  it("lets the session draft win over the server draft (most recent local edit)", async () => {
    rpc.mockResolvedValueOnce({ data: { companyName: "Server Co", fleetSize: "150" }, error: null });
    saveSessionDraft({ companyName: "Local Co" } as WizardDraft);
    const draft = await loadWizardDraft("user-1", undefined);
    expect(draft.companyName).toBe("Local Co"); // session overrides server
    expect(draft.fleetSize).toBe("150"); // server field with no local override survives
  });

  it("an empty-object server draft does not wipe a local session edit", async () => {
    // The server path runs (rpc is called) and returns {}; the merge must leave
    // the more-recent session edit and the defaults intact rather than clobber
    // them. Asserted against a session value because a force-overridden field
    // (contactEmail) or a still-default field can't distinguish "{} merged" from
    // "{} skipped" — only a surviving local edit pins observable behavior.
    rpc.mockResolvedValueOnce({ data: {}, error: null });
    saveSessionDraft({ companyName: "Local Co" } as WizardDraft);
    const draft = await loadWizardDraft("user-1", "ops@acme.com");
    expect(rpc).toHaveBeenCalledWith("get_pilot_draft");
    expect(draft.companyName).toBe("Local Co"); // session edit survives an empty server draft
    expect(draft.fleetSize).toBe(""); // untouched default
  });

  it("NEVER restores loiAgreed/loiInitials, even if a draft tries to smuggle them in", async () => {
    rpc.mockResolvedValueOnce({ data: { loiAgreed: true, loiInitials: "AB" }, error: null });
    saveSessionDraft({ loiAgreed: true, loiInitials: "ZZ" } as WizardDraft);
    const draft = await loadWizardDraft("user-1", undefined);
    expect(draft.loiAgreed).toBe(false);
    expect(draft.loiInitials).toBe("");
  });

  it("prefers the live user email over a draft's stored contactEmail", async () => {
    rpc.mockResolvedValueOnce({ data: { contactEmail: "stale@old.com" }, error: null });
    const draft = await loadWizardDraft("user-1", "current@acme.com");
    expect(draft.contactEmail).toBe("current@acme.com");
  });

  it("falls back to the draft's contactEmail when the user has no email", async () => {
    rpc.mockResolvedValueOnce({ data: { contactEmail: "draft@acme.com" }, error: null });
    const draft = await loadWizardDraft("user-1", undefined);
    expect(draft.contactEmail).toBe("draft@acme.com");
  });
});

describe("scheduleDraftPersist", () => {
  it("always writes the session draft synchronously, with LOI fields stripped", () => {
    scheduleDraftPersist(undefined, { companyName: "Acme", loiAgreed: true, loiInitials: "AB" } as WizardDraft);
    const stored = loadSessionDraft();
    expect(stored?.companyName).toBe("Acme");
    expect(stored?.loiAgreed).toBe(false);
    expect(stored?.loiInitials).toBe("");
  });

  it("does not touch the server when there is no signed-in user", () => {
    scheduleDraftPersist(undefined, { companyName: "Acme" } as WizardDraft);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("debounces the server upsert and omits LOI fields from the payload", () => {
    vi.useFakeTimers();
    rpc.mockReturnValue(Promise.resolve({ error: null }));
    scheduleDraftPersist("user-1", { companyName: "Acme", loiAgreed: true, loiInitials: "AB" } as WizardDraft);
    expect(rpc).not.toHaveBeenCalled(); // nothing fires before the debounce elapses
    vi.advanceTimersByTime(800);
    expect(rpc).toHaveBeenCalledTimes(1);
    const [fn, args] = rpc.mock.calls[0];
    expect(fn).toBe("upsert_pilot_draft");
    expect(args.p_payload.companyName).toBe("Acme");
    expect(args.p_payload).not.toHaveProperty("loiAgreed");
    expect(args.p_payload).not.toHaveProperty("loiInitials");
  });

  it("collapses rapid edits into a single server write (only the last survives the debounce)", () => {
    vi.useFakeTimers();
    rpc.mockReturnValue(Promise.resolve({ error: null }));
    scheduleDraftPersist("user-1", { companyName: "First" } as WizardDraft);
    vi.advanceTimersByTime(400); // less than the 800ms window
    scheduleDraftPersist("user-1", { companyName: "Second" } as WizardDraft);
    vi.advanceTimersByTime(800);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc.mock.calls[0][1].p_payload.companyName).toBe("Second");
  });
});

describe("clearAllDrafts", () => {
  it("clears the session draft and asks the server to delete its copy", async () => {
    saveSessionDraft({ companyName: "Acme" } as WizardDraft);
    rpc.mockResolvedValueOnce({ error: null });
    await clearAllDrafts();
    expect(loadSessionDraft()).toBeNull();
    expect(rpc).toHaveBeenCalledWith("delete_pilot_draft");
  });
});
