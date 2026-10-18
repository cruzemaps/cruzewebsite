import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Inbox, Search, Check, RotateCcw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  BASE_COLUMNS,
  INBOX_COLUMNS,
  MESSAGE_LIMIT,
  type ContactMessage,
  type MessageFilter,
  countOpen,
  filterMessages,
  isMissingColumnError,
  replyHref,
  toContactMessage,
} from "@/lib/contactMessages";

const DEMO_MESSAGES: ContactMessage[] = [
  {
    id: "demo-msg-1",
    name: "Lori Chen",
    email: "lori@example.com",
    organization: "Swift Transport Logistics",
    message: "We run 300 trucks on I-35.\nCould we talk about a pilot next month?",
    created_at: "2026-10-17T15:20:00Z",
    handled_at: null,
    handled_by: null,
  },
  {
    id: "demo-msg-2",
    name: "Sam Patel",
    email: "sam@example.com",
    organization: null,
    message: "Saw the stop-and-go simulation. How does Cruze handle work zones?",
    created_at: "2026-10-16T09:05:00Z",
    handled_at: "2026-10-16T11:00:00Z",
    handled_by: "demo-admin",
  },
];

const fetchInbox = (columns: string) =>
  supabase.from("contact_messages").select(columns).order("created_at", { ascending: false }).limit(MESSAGE_LIMIT);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export default function MessagesTab({
  isDemo,
  drillDownToken = 0,
  onOpenCountChange,
}: {
  isDemo: boolean;
  drillDownToken?: number;
  onOpenCountChange?: (open: number) => void;
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  // False until migration 020 adds handled_at / handled_by. The list still
  // loads; marking handled is switched off.
  const [inboxReady, setInboxReady] = useState(true);
  const [filter, setFilter] = useState<MessageFilter>("open");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [handlerEmails, setHandlerEmails] = useState<Record<string, string>>({});

  const lookUpHandlers = async (rows: ContactMessage[]) => {
    const ids = Array.from(new Set(rows.map((m) => m.handled_by).filter(Boolean)));
    if (ids.length === 0) return;
    const { data } = await supabase.from("profiles").select("id, email").in("id", ids);
    if (data) {
      setHandlerEmails((prev) => {
        const next = { ...prev };
        for (const p of data as { id: string; email: string | null }[]) if (p.email) next[p.id] = p.email;
        return next;
      });
    }
  };

  const load = async () => {
    setLoading(true);
    if (isDemo) {
      setMessages(DEMO_MESSAGES);
      setHandlerEmails({ "demo-admin": "admin@example.com" });
      setInboxReady(true);
      setLoading(false);
      return;
    }
    let ready = true;
    let res = await fetchInbox(INBOX_COLUMNS);
    if (res.error && isMissingColumnError(res.error)) {
      ready = false;
      res = await fetchInbox(BASE_COLUMNS);
    }
    if (res.error) {
      toast.error(`Couldn't load messages: ${res.error.message}`);
      setMessages([]);
      setLoading(false);
      return;
    }
    const rows = ((res.data as unknown as Record<string, unknown>[]) || []).map(toContactMessage);
    setInboxReady(ready);
    setMessages(rows);
    setLoading(false);
    lookUpHandlers(rows);
  };

  useEffect(() => {
    load();
  }, [isDemo]);

  useEffect(() => {
    if (drillDownToken > 0) {
      setFilter("open");
      setQuery("");
    }
  }, [drillDownToken]);

  useEffect(() => {
    if (!loading && inboxReady) onOpenCountChange?.(countOpen(messages));
  }, [messages, loading, inboxReady, onOpenCountChange]);

  const setHandled = async (m: ContactMessage, handled: boolean) => {
    if (isDemo) {
      setMessages((prev) =>
        prev.map((x) =>
          x.id === m.id
            ? { ...x, handled_at: handled ? new Date().toISOString() : null, handled_by: handled ? "demo-admin" : null }
            : x
        )
      );
      toast.success(handled ? "Demo: marked handled locally." : "Demo: reopened locally.");
      return;
    }
    if (!user?.id) {
      toast.error("Sign in as an admin to update messages.");
      return;
    }
    setBusyId(m.id);
    const change = handled
      ? { handled_at: new Date().toISOString(), handled_by: user.id }
      : { handled_at: null, handled_by: null };
    let request = supabase.from("contact_messages").update(change).eq("id", m.id);
    // Only flip a message that is still in the state the admin saw.
    request = handled ? request.is("handled_at", null) : request.not("handled_at", "is", null);
    const { data, error } = await request.select("id, handled_at, handled_by");
    setBusyId(null);
    if (error) {
      toast.error(isMissingColumnError(error) ? "Marking handled needs database migration 020." : error.message);
      return;
    }
    if (!data || data.length === 0) {
      toast.info("Someone else already changed this message. Refreshing.");
      load();
      return;
    }
    const updated = data[0] as Pick<ContactMessage, "id" | "handled_at" | "handled_by">;
    setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, ...updated } : x)));
    if (handled && user.email) setHandlerEmails((prev) => ({ ...prev, [user.id]: user.email }));
    toast.success(handled ? "Marked handled." : "Moved back to open.");
  };

  const filtered = useMemo(() => filterMessages(messages, filter, query), [messages, filter, query]);
  const openCount = countOpen(messages);

  return (
    <Card className="bg-[#0F131C] border-white/10">
      <CardContent className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="font-display font-semibold text-lg flex items-center gap-2">
              <Inbox size={18} className="text-brand-cyan" /> Contact messages
            </h3>
            <p className="text-white/50 text-sm mt-0.5">
              Sent through the contact form on the homepage. Reply by email, then mark the message handled.
            </p>
          </div>
          <div className="text-xs text-white/50">
            <span className="text-white font-display text-lg font-bold">{openCount}</span> open
          </div>
        </div>

        {!loading && !inboxReady && (
          <div className="mb-4 p-3 rounded-lg border border-brand-orange/30 bg-brand-orange/5 text-xs text-brand-orange">
            Marking messages handled turns on once database migration 020 is applied. Until then every message shows as
            open.
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
            <Input
              placeholder="Search by name, email, or organization"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white"
            />
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as MessageFilter)}>
            <SelectTrigger aria-label="Show" className="w-[160px] bg-white/5 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="handled">Handled</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="animate-spin text-brand-cyan" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-white/40">
            <Inbox className="mx-auto mb-3 opacity-50" size={32} />
            {messages.length === 0 ? (
              <>
                <div className="font-medium mb-1">No messages yet</div>
                <div className="text-xs text-white/30 max-w-md mx-auto">
                  Messages from the contact form on the homepage show up here, newest first.
                </div>
              </>
            ) : filter === "open" && !query ? (
              "No open messages. Everything has been handled."
            ) : (
              "No messages match these filters."
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((m) => {
              const href = replyHref(m.email);
              return (
                <li key={m.id} className="rounded-xl border border-white/10 bg-[#0B0E14] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium break-words">
                        {m.organization || <span className="text-white/40">No organization given</span>}
                      </div>
                      <div className="text-xs text-white/50 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                        <span className="text-white/80">{m.name}</span>
                        {href ? (
                          <a href={href} className="text-brand-cyan hover:underline break-all">
                            {m.email}
                          </a>
                        ) : (
                          <span className="break-all">{m.email}</span>
                        )}
                        <span>{formatDate(m.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {m.handled_at ? (
                        <>
                          <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Handled {formatDate(m.handled_at)}
                            {m.handled_by && ` by ${handlerEmails[m.handled_by] ?? "an admin"}`}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busyId === m.id}
                            onClick={() => setHandled(m, false)}
                            className="text-white/60 hover:text-white hover:bg-white/5"
                          >
                            <RotateCcw size={12} className="mr-1.5" /> Reopen
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!inboxReady || busyId === m.id}
                          onClick={() => setHandled(m, true)}
                          className="border-white/10 text-white"
                        >
                          {busyId === m.id ? (
                            <Loader2 size={12} className="mr-1.5 animate-spin" />
                          ) : (
                            <Check size={12} className="mr-1.5" />
                          )}
                          Mark handled
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-white/80 whitespace-pre-wrap break-words">{m.message}</p>
                </li>
              );
            })}
          </ul>
        )}

        {!loading && messages.length >= MESSAGE_LIMIT && (
          <div className="mt-4 text-xs text-white/40">Showing the newest {MESSAGE_LIMIT.toLocaleString()} messages.</div>
        )}
      </CardContent>
    </Card>
  );
}
