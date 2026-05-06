import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Search, Shield, ShieldOff, Users as UsersIcon, Eye, AlertTriangle, Archive, ArchiveRestore } from "lucide-react";
import { track } from "@/lib/analytics";

type Profile = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: "admin" | "fleet_owner" | "city_operator";
  status: "pending" | "active" | "suspended" | "archived";
  requested_role?: string | null;
  organization_id?: string | null;
  last_active_at?: string | null;
  created_at: string;
};

const DEMO_USERS: Profile[] = [
  { id: "u1", email: "lori@swifttransport.com", first_name: "Lori", last_name: "Chen", role: "fleet_owner", status: "active", created_at: "2026-01-12T10:00:00Z", last_active_at: "2026-05-04T08:14:00Z" },
  { id: "u2", email: "p.davis@cityofaustin.gov", first_name: "Pat", last_name: "Davis", role: "city_operator", status: "active", created_at: "2026-02-04T10:00:00Z", last_active_at: "2026-05-03T16:42:00Z" },
  { id: "u3", email: "ops@alphafreight.com", first_name: "Sam", last_name: "Patel", role: "fleet_owner", status: "pending", requested_role: "city_operator", created_at: "2026-04-30T10:00:00Z" },
  { id: "u4", email: "founder@example.com", first_name: "Anudeep", last_name: "Bonagiri", role: "admin", status: "active", created_at: "2024-09-01T10:00:00Z" },
];

export default function UsersTab({ isDemo }: { isDemo: boolean }) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [editing, setEditing] = useState<Profile | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  // Audit #34: replace browser prompt()/confirm() with shadcn Dialogs.
  const [archiveTarget, setArchiveTarget] = useState<{ user: Profile; archive: boolean } | null>(null);
  const [archiveReason, setArchiveReason] = useState("");
  const [archiveBusy, setArchiveBusy] = useState(false);
  const [impersonateTarget, setImpersonateTarget] = useState<Profile | null>(null);
  const [impersonateBusy, setImpersonateBusy] = useState(false);

  const toggleSelected = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Archive (soft-delete) or restore a user. Goes through the same
  // change_user_role RPC so the action is captured in role_history.
  const submitArchiveOrRestore = async () => {
    if (!archiveTarget) return;
    const { user: u, archive } = archiveTarget;
    const verb = archive ? "archive" : "restore";
    const reason = archiveReason.trim();
    if (reason.length < 3) {
      toast.error("Please enter a reason (3+ characters).");
      return;
    }
    setArchiveBusy(true);
    if (isDemo) {
      setUsers((prev) => prev.map((p) => (p.id === u.id ? { ...p, status: archive ? "archived" : "active" } : p)));
      toast.success(`Demo: ${u.email} ${verb}d locally.`);
      setArchiveBusy(false);
      setArchiveTarget(null);
      return;
    }
    const { error } = await supabase.rpc("change_user_role", {
      target_user_id: u.id,
      new_role: u.role,
      new_status: archive ? "archived" : "active",
      reason,
    });
    setArchiveBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setUsers((prev) => prev.map((p) => (p.id === u.id ? { ...p, status: archive ? "archived" : "active" } : p)));
    toast.success(`${u.email} ${verb}d.`);
    setArchiveTarget(null);
  };

  const confirmImpersonate = async () => {
    if (!impersonateTarget) return;
    const u = impersonateTarget;
    setImpersonateBusy(true);
    // Audit #35: AWAIT the audit row before opening the impersonation tab.
    // Otherwise the admin can act as the user before the audit entry lands,
    // creating an inversion where the impersonated session writes ride
    // ahead of the audit record. Failures are surfaced rather than silently
    // dropped.
    if (!isDemo) {
      const { error } = await supabase.rpc("change_user_role", {
        target_user_id: u.id,
        new_role: u.role,
        new_status: u.status,
        reason: `Impersonation session opened by admin`,
      });
      if (error) {
        setImpersonateBusy(false);
        toast.error(`Audit log failed: ${error.message}. Impersonation cancelled.`);
        return;
      }
    }
    // 2nd-pass audit #13: only track the analytics event AFTER the audit
    // RPC succeeds. Previously PostHog could record an "impersonation"
    // event for sessions that never opened.
    track("role_changed", { event: "impersonation", target: u.id });
    // CRITICAL: We previously wrote demo_role to localStorage, which is
    // shared across all tabs of the same origin. That contaminated the
    // admin's own tab. Now we hand off impersonation context as URL params
    // to a dedicated /impersonate route. That route reads the params,
    // writes them to *sessionStorage* (per-tab, isolated), then redirects
    // to the impersonated user's dashboard. The admin's original tab is
    // untouched and keeps its real Supabase session.
    const dashboard =
      u.role === "admin" ? "/admin" :
      u.role === "city_operator" ? "/dashboard" :
      "/fleet-dashboard";
    const url = `/impersonate?role=${u.role}&status=${u.status}&id=${u.id}&go=${encodeURIComponent(dashboard)}`;
    window.open(url, "_blank", "noopener");
    setImpersonateBusy(false);
    setImpersonateTarget(null);
  };

  const load = async () => {
    setLoading(true);
    if (isDemo) {
      setUsers(DEMO_USERS);
      setLoading(false);
      return;
    }
    // Audit #27: narrow the column list to what the table actually renders
    // — avoids SELECT * and the implicit dependency on profiles having a
    // stable shape.
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, email, first_name, last_name, role, status, requested_role, organization_id, last_active_at, created_at"
      )
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setUsers((data as Profile[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [isDemo]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter === "all_visible") {
        if (u.status === "archived") return false;
      } else if (statusFilter !== "all") {
        if (u.status !== statusFilter) return false;
      }
      if (query) {
        const q = query.toLowerCase();
        const fields = [u.email, u.first_name, u.last_name].filter(Boolean).join(" ").toLowerCase();
        if (!fields.includes(q)) return false;
      }
      return true;
    });
  }, [users, query, roleFilter, statusFilter]);

  return (
    <Card className="bg-[#0F131C] border-white/10">
      <CardContent className="p-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
            <Input
              placeholder="Search name or email"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white"><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="fleet_owner">Fleet owner</SelectItem>
              <SelectItem value="city_operator">City operator</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px] bg-white/5 border-white/10 text-white"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active (default)</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="archived">Archived (deleted)</SelectItem>
              <SelectItem value="all_visible">All except archived</SelectItem>
              <SelectItem value="all">All including archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-brand-cyan" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-white/40">
            <UsersIcon className="mx-auto mb-3 opacity-50" />
            No users match these filters.
          </div>
        ) : (
          <>
            {selected.size > 0 && (
              <div className="mb-4 flex items-center gap-3 p-3 rounded-lg bg-brand-cyan/10 border border-brand-cyan/30">
                <span className="text-sm text-brand-cyan font-semibold">{selected.size} selected</span>
                <Button size="sm" onClick={() => setBulkOpen(true)} className="bg-brand-cyan text-[#0B0E14] hover:bg-brand-cyan/90">
                  Bulk update
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-white/50 border-b border-white/5">
                    <th className="py-3 px-2 font-medium w-8">
                      <input
                        type="checkbox"
                        aria-label="Select all"
                        checked={filtered.length > 0 && filtered.every((u) => selected.has(u.id))}
                        onChange={(e) => {
                          if (e.target.checked) setSelected(new Set(filtered.map((u) => u.id)));
                          else setSelected(new Set());
                        }}
                      />
                    </th>
                    <th className="py-3 px-2 font-medium">User</th>
                    <th className="py-3 px-2 font-medium">Role</th>
                    <th className="py-3 px-2 font-medium">Status</th>
                    <th className="py-3 px-2 font-medium">Requested</th>
                    <th className="py-3 px-2 font-medium">Last active</th>
                    <th className="py-3 px-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="py-3 px-2">
                        <input
                          type="checkbox"
                          aria-label={`Select ${u.email}`}
                          checked={selected.has(u.id)}
                          onChange={() => toggleSelected(u.id)}
                        />
                      </td>
                      <td className="py-3 px-2">
                        <div className="font-medium">{u.first_name} {u.last_name}</div>
                        <div className="text-white/40 text-xs">{u.email}</div>
                      </td>
                      <td className="py-3 px-2"><RoleBadge role={u.role} /></td>
                      <td className="py-3 px-2"><StatusBadge status={u.status} /></td>
                      <td className="py-3 px-2 text-white/60">{u.requested_role || "N/A"}</td>
                      <td className="py-3 px-2 text-white/60 text-xs">{u.last_active_at ? new Date(u.last_active_at).toLocaleDateString() : "N/A"}</td>
                      <td className="py-3 px-2 text-right whitespace-nowrap">
                        <Button size="sm" variant="ghost" onClick={() => setImpersonateTarget(u)} title="View as this user (logged)">
                          <Eye size={14} />
                        </Button>
                        {u.status === "archived" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setArchiveReason(""); setArchiveTarget({ user: u, archive: false }); }}
                            title="Restore from archive"
                            className="text-emerald-400 hover:text-emerald-300"
                          >
                            <ArchiveRestore size={14} />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setArchiveReason(""); setArchiveTarget({ user: u, archive: true }); }}
                            title="Archive (soft-delete)"
                            className="text-white/50 hover:text-red-400"
                          >
                            <Archive size={14} />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => setEditing(u)}>Manage</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>

      {editing && (
        <ManageUserDialog
          user={editing}
          isDemo={isDemo}
          onClose={() => setEditing(null)}
          onUpdated={(u) => {
            setUsers((prev) => prev.map((p) => (p.id === u.id ? u : p)));
            setEditing(null);
          }}
        />
      )}

      {bulkOpen && (
        <BulkUpdateDialog
          count={selected.size}
          isDemo={isDemo}
          onClose={() => setBulkOpen(false)}
          // Pass the actual selected user objects so the dialog has the
          // current role for `no_change` (audit #9) without re-querying.
          targets={users.filter((u) => selected.has(u.id))}
          onApplied={(applied) => {
            setUsers((prev) =>
              prev.map((u) => {
                const upd = applied.get(u.id);
                if (!upd) return u;
                return {
                  ...u,
                  ...(upd.role ? { role: upd.role } : {}),
                  ...(upd.status ? { status: upd.status } : {}),
                };
              })
            );
            setSelected(new Set());
            setBulkOpen(false);
          }}
        />
      )}

      {/* Audit #34: Archive/restore confirmation dialog (replaces prompt). */}
      <Dialog open={!!archiveTarget} onOpenChange={(o) => { if (!archiveBusy && !o) setArchiveTarget(null); }}>
        <DialogContent className="bg-[#0B0E14] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              {archiveTarget?.archive ? <Archive size={18} /> : <ArchiveRestore size={18} />}
              {archiveTarget?.archive ? "Archive user" : "Restore user"}
            </DialogTitle>
            <DialogDescription className="text-white/50">
              {archiveTarget?.user.email} — {archiveTarget?.archive ? "soft-delete" : "bring back to active"}.
              The reason is stored in the role_history audit log.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label className="text-white/70 text-sm">Reason (3+ characters)</Label>
            <Textarea
              value={archiveReason}
              onChange={(e) => setArchiveReason(e.target.value)}
              rows={3}
              placeholder={archiveTarget?.archive ? "e.g. Account dormant 90+ days" : "e.g. Verified active employment again"}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setArchiveTarget(null)} disabled={archiveBusy}>Cancel</Button>
            <Button
              onClick={submitArchiveOrRestore}
              disabled={archiveBusy || archiveReason.trim().length < 3}
              className="bg-brand-orange text-[#0B0E14] hover:bg-brand-orange/90 font-bold"
            >
              {archiveBusy && <Loader2 className="animate-spin mr-2" size={14} />}
              {archiveTarget?.archive ? "Archive" : "Restore"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit #34/#35: Impersonate confirmation dialog (replaces confirm). */}
      <Dialog open={!!impersonateTarget} onOpenChange={(o) => { if (!impersonateBusy && !o) setImpersonateTarget(null); }}>
        <DialogContent className="bg-[#0B0E14] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Eye size={18} /> Impersonate user
            </DialogTitle>
            <DialogDescription className="text-white/50">
              You're about to open a new tab acting as <strong className="text-white">{impersonateTarget?.email}</strong>.
              The action is logged in the role_history audit trail before the tab opens.
              Your own admin tab is unaffected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setImpersonateTarget(null)} disabled={impersonateBusy}>Cancel</Button>
            <Button
              onClick={confirmImpersonate}
              disabled={impersonateBusy}
              className="bg-brand-cyan text-[#0B0E14] hover:bg-brand-cyan/90 font-bold"
            >
              {impersonateBusy && <Loader2 className="animate-spin mr-2" size={14} />}
              Open as user
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function BulkUpdateDialog({
  count,
  isDemo,
  onClose,
  onApplied,
  targets,
}: {
  count: number;
  isDemo: boolean;
  onClose: () => void;
  // Audit #10: callback receives a per-user map so we only mutate locally
  // for rows the server actually accepted.
  onApplied: (applied: Map<string, { role?: Profile["role"]; status?: Profile["status"] }>) => void;
  // Audit #9: pass the full target objects so we already have each user's
  // current role for the `no_change` case — no per-row lookup query.
  targets: Profile[];
}) {
  const [newRole, setNewRole] = useState<Profile["role"] | "no_change">("no_change");
  const [newStatus, setNewStatus] = useState<Profile["status"] | "no_change">("no_change");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const apply = async () => {
    if (newRole === "no_change" && newStatus === "no_change") return;
    if (reason.trim().length < 3) return toast.error("A reason of at least 3 characters is required.");
    setBusy(true);

    const intendedRole = newRole !== "no_change" ? newRole : undefined;
    const intendedStatus = newStatus !== "no_change" ? newStatus : undefined;

    if (isDemo) {
      const applied = new Map<string, { role?: Profile["role"]; status?: Profile["status"] }>();
      for (const t of targets) applied.set(t.id, { role: intendedRole, status: intendedStatus });
      onApplied(applied);
      toast.success(`Demo: ${count} users updated locally.`);
      setBusy(false);
      return;
    }

    // Audit #9 + #10: fan out the RPCs and track which IDs failed so the
    // parent only mutates state for the ones that actually succeeded.
    // 2nd-pass audit #5: cap concurrency so a 500-user bulk update doesn't
    // ship 500 simultaneous change_user_role transactions — each RPC writes
    // to role_history under the same admin's id and they contend on FK
    // validation locks. CONCURRENCY=4 keeps the round-trip count low while
    // staying gentle on the DB.
    const CONCURRENCY = 4;
    const results: { id: string; error: { message: string } | null }[] = [];
    for (let i = 0; i < targets.length; i += CONCURRENCY) {
      const batch = targets.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(
        batch.map(async (t) => {
          const { error } = await supabase.rpc("change_user_role", {
            target_user_id: t.id,
            new_role: intendedRole ?? t.role,
            new_status: intendedStatus ?? null,
            reason: `BULK: ${reason}`,
          });
          return { id: t.id, error };
        })
      );
      results.push(...batchResults);
    }
    setBusy(false);

    const applied = new Map<string, { role?: Profile["role"]; status?: Profile["status"] }>();
    const failedIds: string[] = [];
    for (const r of results) {
      if (r.error) failedIds.push(r.id);
      else applied.set(r.id, { role: intendedRole, status: intendedStatus });
    }

    if (failedIds.length === 0) {
      toast.success(`Updated ${count} users.`);
    } else if (failedIds.length === count) {
      toast.error(`All ${count} updates failed. First error: ${results[0].error?.message ?? "(unknown)"}`);
    } else {
      toast.error(
        `${failedIds.length}/${count} updates failed. ${count - failedIds.length} applied. ` +
          `Failed IDs (first 3): ${failedIds.slice(0, 3).join(", ")}${failedIds.length > 3 ? "…" : ""}`
      );
    }
    onApplied(applied);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-[#0B0E14] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <AlertTriangle size={18} className="text-brand-orange" /> Bulk update {count} users
          </DialogTitle>
          <DialogDescription className="text-white/50">
            Each user will get its own audit-log entry with the reason below.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label className="text-white/70 text-sm mb-2 block">Role</Label>
            <Select value={newRole} onValueChange={(v) => setNewRole(v as typeof newRole)}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="no_change">No change</SelectItem>
                <SelectItem value="fleet_owner">Fleet owner</SelectItem>
                <SelectItem value="city_operator">City operator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-white/70 text-sm mb-2 block">Status</Label>
            <Select value={newStatus} onValueChange={(v) => setNewStatus(v as typeof newStatus)}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="no_change">No change</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-white/70 text-sm mb-2 block">Reason for bulk change *</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} className="bg-white/5 border-white/10 text-white" rows={3} placeholder="e.g. Approving all Class-8 fleet operators in Texas pilot cohort." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={apply}
            disabled={busy || (newRole === "no_change" && newStatus === "no_change")}
            className="bg-brand-orange text-[#0B0E14] hover:bg-brand-orange/90 font-bold"
          >
            {busy ? <Loader2 className="animate-spin mr-2" size={14} /> : null}
            Apply to {count} users
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RoleBadge({ role }: { role: Profile["role"] }) {
  const map: Record<Profile["role"], string> = {
    admin: "bg-brand-orange/15 text-brand-orange border-brand-orange/30",
    city_operator: "bg-brand-cyan/15 text-brand-cyan border-brand-cyan/30",
    fleet_owner: "bg-white/10 text-white/70 border-white/20",
  };
  return <span className={`text-xs px-2 py-1 rounded-full border ${map[role]}`}>{role.replace("_", " ")}</span>;
}

function StatusBadge({ status }: { status: Profile["status"] }) {
  const map: Record<Profile["status"], string> = {
    active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    suspended: "bg-red-500/15 text-red-400 border-red-500/30",
    archived: "bg-white/10 text-white/40 border-white/20",
  };
  return <span className={`text-xs px-2 py-1 rounded-full border ${map[status]}`}>{status}</span>;
}

function ManageUserDialog({
  user,
  isDemo,
  onClose,
  onUpdated,
}: {
  user: Profile;
  isDemo: boolean;
  onClose: () => void;
  onUpdated: (u: Profile) => void;
}) {
  const [newRole, setNewRole] = useState<Profile["role"]>(user.role);
  const [newStatus, setNewStatus] = useState<Profile["status"]>(user.status);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const dirty = newRole !== user.role || newStatus !== user.status;

  const apply = async () => {
    if (!dirty) return;
    if (reason.trim().length < 3) return toast.error("Reason is required (3+ chars).");
    setBusy(true);

    if (isDemo) {
      onUpdated({ ...user, role: newRole, status: newStatus });
      toast.success("Demo: role/status updated locally.");
      track("role_changed", { user_id: user.id, new_role: newRole, demo: true });
      setBusy(false);
      return;
    }

    const { error } = await supabase.rpc("change_user_role", {
      target_user_id: user.id,
      new_role: newRole,
      new_status: newStatus,
      reason,
    });
    setBusy(false);
    if (error) return toast.error(error.message);

    toast.success("Updated. The user will pick up new claims on their next session refresh.");
    track("role_changed", { user_id: user.id, new_role: newRole });
    onUpdated({ ...user, role: newRole, status: newStatus });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-[#0B0E14] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Shield size={18} /> Manage {user.first_name} {user.last_name}
          </DialogTitle>
          <DialogDescription className="text-white/50">{user.email}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="text-white/70 text-sm mb-2 block">Role</Label>
            <Select value={newRole} onValueChange={(v) => setNewRole(v as Profile["role"])}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fleet_owner">Fleet owner</SelectItem>
                <SelectItem value="city_operator">City operator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            {user.requested_role && user.requested_role !== user.role && (
              <p className="text-xs text-yellow-400/80 mt-1">User originally requested: {user.requested_role}</p>
            )}
          </div>

          <div>
            <Label className="text-white/70 text-sm mb-2 block">Status</Label>
            <Select value={newStatus} onValueChange={(v) => setNewStatus(v as Profile["status"])}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-white/70 text-sm mb-2 block">Reason for change (audit log)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Verified employment with Austin DOT. Promoting to city_operator."
              className="bg-white/5 border-white/10 text-white"
              rows={3}
            />
          </div>

          {(newRole !== user.role || newStatus !== user.status) && (
            <div className="flex items-start gap-2 text-xs text-yellow-400/80 bg-yellow-500/5 border border-yellow-500/20 p-3 rounded-lg">
              <ShieldOff size={14} className="flex-shrink-0 mt-0.5" />
              <p>The user's JWT keeps the old role until their next session refresh (typically &lt;1h). For instant effect, ask them to sign out and back in.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={apply} disabled={!dirty || busy} className="bg-brand-cyan text-[#0B0E14] hover:bg-brand-cyan/90">
            {busy ? <Loader2 className="animate-spin mr-2" size={14} /> : null}
            Apply changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
