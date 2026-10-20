import { describe, expect, it } from "vitest";
import {
  type ContactMessage,
  countOpen,
  filterMessages,
  isMissingColumnError,
  replyHref,
  toContactMessage,
} from "./contactMessages";

const msg = (over: Partial<ContactMessage>): ContactMessage => ({
  id: "1",
  name: "Dana Lee",
  email: "dana@example.com",
  organization: "Acme Freight",
  message: "Hello",
  created_at: "2026-10-18T12:00:00Z",
  handled_at: null,
  handled_by: null,
  ...over,
});

const inbox = [
  msg({ id: "1" }),
  msg({ id: "2", name: "Sam Patel", email: "sam@txdot.example", organization: "TxDOT", handled_at: "2026-10-18T13:00:00Z", handled_by: "a" }),
  msg({ id: "3", name: "Lee Park", email: "lee@fund.example", organization: null }),
];

describe("filterMessages", () => {
  it("filters open, handled and all", () => {
    expect(filterMessages(inbox, "open", "").map((m) => m.id)).toEqual(["1", "3"]);
    expect(filterMessages(inbox, "handled", "").map((m) => m.id)).toEqual(["2"]);
    expect(filterMessages(inbox, "all", "").map((m) => m.id)).toEqual(["1", "2", "3"]);
  });

  it("searches name, email and organization, case-insensitively", () => {
    expect(filterMessages(inbox, "all", "LEE").map((m) => m.id)).toEqual(["1", "3"]);
    expect(filterMessages(inbox, "all", "txdot").map((m) => m.id)).toEqual(["2"]);
    expect(filterMessages(inbox, "all", "fund.example").map((m) => m.id)).toEqual(["3"]);
    expect(filterMessages(inbox, "all", "  acme ").map((m) => m.id)).toEqual(["1"]);
  });

  it("does not search the message body", () => {
    expect(filterMessages(inbox, "all", "hello")).toEqual([]);
  });
});

describe("isMissingColumnError", () => {
  it("recognises PostgREST's missing column error", () => {
    expect(isMissingColumnError({ code: "42703", message: "column contact_messages.handled_at does not exist" })).toBe(true);
    expect(isMissingColumnError({ message: "column contact_messages.handled_by does not exist" })).toBe(true);
    expect(isMissingColumnError({ code: "42501", message: "permission denied for table contact_messages" })).toBe(false);
    expect(isMissingColumnError(null)).toBe(false);
  });
});

describe("toContactMessage", () => {
  it("treats rows without the handled columns as open", () => {
    const m = toContactMessage({ id: "9", name: "A", email: "a@b.co", organization: null, message: "x", created_at: "t" });
    expect(m.handled_at).toBeNull();
    expect(m.handled_by).toBeNull();
    expect(countOpen([m])).toBe(1);
  });
});

describe("replyHref", () => {
  it("links plain addresses", () => {
    expect(replyHref("dana@example.com")).toBe("mailto:dana@example.com?subject=Re%3A%20your%20message%20to%20Cruze");
    expect(replyHref(" o'neil+ops@fleet.co.uk ")).toMatch(/^mailto:o'neil\+ops@fleet\.co\.uk\?/);
  });

  it("refuses addresses that would add mailto parameters or other schemes", () => {
    expect(replyHref("a@b.com?cc=everyone@b.com")).toBeNull();
    expect(replyHref("a@b.com&bcc=x@y.com")).toBeNull();
    expect(replyHref("javascript:alert(1)//@b.com")).toBeNull();
    expect(replyHref("not an email")).toBeNull();
  });
});
