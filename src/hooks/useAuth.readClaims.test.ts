import { describe, it, expect } from "vitest";
import type { Session } from "@supabase/supabase-js";
import { readClaims } from "./useAuth";

// Build a minimal JWT-shaped string: header.payload.signature where only the
// payload (middle segment) is encoded. readClaims only ever decodes the middle
// segment, so the header/signature are placeholders. Real JWTs encode the
// payload as base64URL (no padding, '-'/'_' alphabet) — encode it the same way
// here so the suite exercises what Supabase actually emits.
function base64url(json: string): string {
  return btoa(json).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function tokenWithClaims(payload: Record<string, unknown>): string {
  return `header.${base64url(JSON.stringify(payload))}.signature`;
}

function sessionWith(token: string | undefined): Session {
  // readClaims only reads `access_token`; cast the partial shape.
  return { access_token: token } as unknown as Session;
}

describe("readClaims — deny-by-default JWT claim decoding", () => {
  it("returns nulls when there is no session (deny-by-default)", () => {
    expect(readClaims(null)).toEqual({ role: null, status: null });
    expect(readClaims(undefined)).toEqual({ role: null, status: null });
  });

  it("returns nulls when the session has no access_token", () => {
    expect(readClaims(sessionWith(undefined))).toEqual({ role: null, status: null });
  });

  it("reads app_role / app_status from the JWT custom claims", () => {
    const token = tokenWithClaims({ app_role: "admin", app_status: "active" });
    expect(readClaims(sessionWith(token))).toEqual({ role: "admin", status: "active" });
  });

  it("decodes a payload whose base64URL contains '-'/'_' (real-JWT alphabet)", () => {
    // Regression guard: a plain atob() throws on the base64URL alphabet, which
    // would deny a legitimate user. This payload's base64URL contains '-'/'_'.
    const token = tokenWithClaims({
      app_role: "fleet_owner",
      app_status: "active",
      note: "ff>?~ ÿÿ",
    });
    expect(base64url(JSON.stringify({ app_role: "fleet_owner", app_status: "active", note: "ff>?~ ÿÿ" }))).toMatch(/[-_]/);
    expect(readClaims(sessionWith(token))).toEqual({ role: "fleet_owner", status: "active" });
  });

  it("returns nulls for missing claims rather than defaulting to a role", () => {
    const token = tokenWithClaims({ sub: "user-123" });
    expect(readClaims(sessionWith(token))).toEqual({ role: null, status: null });
  });

  it("does NOT fall back to user_metadata.role (privilege-escalation guard)", () => {
    // user_metadata is user-controllable at signup; a role there must never
    // be honored. Only the hook-set app_role claim counts.
    const token = tokenWithClaims({ user_metadata: { role: "admin" } });
    expect(readClaims(sessionWith(token))).toEqual({ role: null, status: null });
  });

  it("denies (returns nulls) when the payload segment is not valid base64/JSON", () => {
    expect(readClaims(sessionWith("header.%%%not-base64%%%.sig"))).toEqual({
      role: null,
      status: null,
    });
  });

  it("denies when the token is malformed (no payload segment)", () => {
    expect(readClaims(sessionWith("not-a-jwt"))).toEqual({ role: null, status: null });
  });
});
