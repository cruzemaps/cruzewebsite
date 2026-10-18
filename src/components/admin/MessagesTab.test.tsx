// @vitest-environment jsdom
//
// Admin Messages tab: newest-first inbox of the contact form.
//   - message text renders as text (never HTML) with line breaks kept
//   - Mark handled writes handled_at + the admin's id, only on an open row
//   - before migration 020 (no handled columns) the tab still loads and the
//     button is off instead of the page crashing
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

type Result = { data: unknown; error: { code?: string; message: string } | null };

// A minimal PostgREST query builder: records each call, resolves to the next
// queued result for that table.
const sb = vi.hoisted(() => {
  const queues: Record<string, Result[]> = {};
  const calls: { table: string; chain: [string, unknown[]][] }[] = [];
  const from = (table: string) => {
    const entry = { table, chain: [] as [string, unknown[]][] };
    calls.push(entry);
    const builder: Record<string, unknown> = {};
    for (const m of ["select", "order", "limit", "update", "eq", "is", "not", "in"]) {
      builder[m] = (...args: unknown[]) => {
        entry.chain.push([m, args]);
        return builder;
      };
    }
    builder.then = (resolve: (r: Result) => unknown, reject: (e: unknown) => unknown) =>
      Promise.resolve(queues[table]?.shift() ?? { data: [], error: null }).then(resolve, reject);
    return builder;
  };
  return { queues, calls, from: vi.fn(from) };
});

vi.mock("@/lib/supabase", () => ({ supabase: { from: sb.from } }));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "00000000-0000-0000-0000-00000000000a", email: "admin@example.com" } }),
}));
const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock("sonner", () => ({ toast: toastMock }));

import MessagesTab from "./MessagesTab";

const row = (over: Record<string, unknown>) => ({
  id: "m1",
  name: "Dana Lee",
  email: "dana@example.com",
  organization: "Acme Freight",
  message: "Hello",
  created_at: "2026-10-18T12:00:00Z",
  handled_at: null,
  handled_by: null,
  ...over,
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  sb.calls.length = 0;
  for (const k of Object.keys(sb.queues)) delete sb.queues[k];
});

describe("MessagesTab", () => {
  it("loads newest first and renders message text as text, keeping line breaks", async () => {
    sb.queues.contact_messages = [
      {
        data: [
          row({ id: "m2", name: "Newer", message: "<img src=x onerror=alert(1)>\nsecond line", created_at: "2026-10-18T13:00:00Z" }),
          row({ id: "m1", name: "Older" }),
        ],
        error: null,
      },
    ];
    const { container } = render(<MessagesTab isDemo={false} />);

    const body = await screen.findByText(/second line/);
    expect(body.textContent).toBe("<img src=x onerror=alert(1)>\nsecond line");
    expect(body.className).toContain("whitespace-pre-wrap");
    expect(container.querySelector("img")).toBeNull();

    const names = screen.getAllByText(/^(Newer|Older)$/).map((n) => n.textContent);
    expect(names).toEqual(["Newer", "Older"]);

    const load = sb.calls[0].chain;
    expect(load).toContainEqual(["order", ["created_at", { ascending: false }]]);
    expect(load[0][1][0]).toContain("handled_at");

    const mail = screen.getAllByRole("link", { name: "dana@example.com" })[0];
    expect(mail.getAttribute("href")).toMatch(/^mailto:dana@example\.com\?subject=/);
  });

  it("marks a message handled with the admin's id, only while it is open", async () => {
    sb.queues.contact_messages = [
      { data: [row({})], error: null },
      { data: [{ id: "m1", handled_at: "2026-10-18T14:00:00Z", handled_by: "00000000-0000-0000-0000-00000000000a" }], error: null },
    ];
    const onOpen = vi.fn();
    render(<MessagesTab isDemo={false} onOpenCountChange={onOpen} />);
    fireEvent.click(await screen.findByRole("button", { name: /Mark handled/ }));

    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Marked handled."));
    const update = sb.calls.find((c) => c.chain.some(([m]) => m === "update"));
    const [, [change]] = update.chain.find(([m]) => m === "update") as [string, [Record<string, unknown>]];
    expect(change.handled_by).toBe("00000000-0000-0000-0000-00000000000a");
    expect(typeof change.handled_at).toBe("string");
    expect(Object.keys(change).sort()).toEqual(["handled_at", "handled_by"]);
    expect(update.chain).toContainEqual(["eq", ["id", "m1"]]);
    expect(update.chain).toContainEqual(["is", ["handled_at", null]]);

    // Default filter is Open, so the handled message leaves the list.
    await waitFor(() => expect(screen.queryByText("Dana Lee")).toBeNull());
    expect(onOpen).toHaveBeenLastCalledWith(0);
  });

  it("before migration 020 it falls back to the base columns and turns the button off", async () => {
    sb.queues.contact_messages = [
      { data: null, error: { code: "42703", message: "column contact_messages.handled_at does not exist" } },
      { data: [{ id: "m1", name: "Dana Lee", email: "dana@example.com", organization: null, message: "Hi", created_at: "2026-10-18T12:00:00Z" }], error: null },
    ];
    const onOpen = vi.fn();
    render(<MessagesTab isDemo={false} onOpenCountChange={onOpen} />);

    expect(await screen.findByText("Hi")).toBeTruthy();
    expect(screen.getByText(/migration 020/)).toBeTruthy();
    expect(screen.getByText("No organization given")).toBeTruthy();
    expect((screen.getByRole("button", { name: /Mark handled/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(sb.calls[1].chain[0][1][0]).not.toContain("handled_at");
    expect(toastMock.error).not.toHaveBeenCalled();
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("shows other load errors instead of an empty inbox", async () => {
    sb.queues.contact_messages = [{ data: null, error: { code: "42501", message: "permission denied" } }];
    render(<MessagesTab isDemo={false} />);
    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Couldn't load messages: permission denied"));
  });

  it("demo mode shows mock data without querying Supabase", async () => {
    render(<MessagesTab isDemo />);
    expect(await screen.findByText("Swift Transport Logistics")).toBeTruthy();
    expect(sb.from).not.toHaveBeenCalled();
  });
});
