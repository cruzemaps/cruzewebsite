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
import { Loader2, Search, Shield, ShieldOff, Users as UsersIcon, Eye, AlertTriangle } from "lucide-react";
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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Profile | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);

  const toggleSelected = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const impersonate = (u: Profile) => {
    if (!confirm(`Impersonate ${u.email}? This opens a new tab acting as them. The action is logged in the audit trail.`)) return;
    // Tag the demo session as an impersonation so dashboards can warn users.
    localStorage.setItem("demo_role", u.role);
    localStorage.setItem("demo_status", u.status);
    sessionStorage.setItem("impersonated_user_id", u.id);
    track("role_changed", { event: "impersonation", target: u.id });
    // Best-effort write to role_history (acts as audit). Non-blocking.
    if (!isDemo) {
      // Best-effort audit row; ignore failures so impersonation never blocks.
      void supabase.rpc("change_user_role", {
        target_user_id: u.id,
        new_role: u.role,
        new_status: u.status,
        reason: `Impersonation session opened by admin`,
      }).then(() => {});
    }
    const target = u.role === "admin" ? "/admin" : u.role === "city_operator" ? "/dashboard" : "/fleet-dashboard";
    window.open(target, "_blank", "noopener");
  };

  const load = async () => {
    setLoading(true);
    if (isDemo) {
      setUsers(DEMO_USERS);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
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
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
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
            <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
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
                        <Button size="sm" variant="ghost" onClick={() => impersonate(u)} title="View as this user (logged)">
                          <Eye size={14} />
                        </Button>
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
          onApplied={(updates) => {
            setUsers((prev) =>
              prev.map((u) =>
                selected.has(u.id)
                  ? {
                      ...u,
                      ...(updates.role ? { role: updates.role } : {}),
                      ...(updates.status ? { status: updates.status } : {}),
                    }
                  : u
              )
            );
            setSelected(new Set());
            setBulkOpen(false);
          }}
          targetIds={Array.from(selected)}
        />
      )}
    </Card>
  );
}

function BulkUpdateDialog({
  count,
  isDemo,
  onClose,
  onApplied,
  targetIds,
}: {
  count: number;
  isDemo: boolean;
  onClose: () => void;
  onApplied: (u: { role?: Profile["role"]; status?: Profile["status"] }) => void;
  targetIds: string[];
}) {
  const [newRole, setNewRole] = useState<Profile["role"] | "no_change">("no_change");
  const [newStatus, setNewStatus] = useState<Profile["status"] | "no_change">("no_change");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const apply = async () => {
    if (newRole === "no_change" && newStatus === "no_change") return;
    if (reason.trim().length < 3) return toast.error("A reason of at least 3 characters is required.");
    setBusy(true);

    if (isDemo) {
      onApplied({
        role: newRole !== "no_change" ? newRole : undefined,
        status: newStatus !== "no_change" ? newStatus : undefined,
      });
      toast.success(`Demo: ${count} users updated locally.`);
      setBusy(false);
      return;
    }

    // Apply the change one user at a time so each gets its own audit row.
    let failed = 0;
    for (const id of targetIds) {
      const { error } = await supabase.rpc("change_user_role", {
        target_user_id: id,
        new_role: newRole !== "no_change" ? newRole : (await supabase.from("profiles").select("role").eq("id", id).single()).data?.role,
        new_status: newStatus !== "no_change" ? newStatus : null,
        reason: `BULK: ${reason}`,
      });
      if (error) failed += 1;
    }
    setBusy(false);
    if (failed > 0) toast.error(`${failed}/${count} updates failed`);
    else toast.success(`Updated ${count} users.`);
    onApplied({
      role: newRole !== "no_change" ? newRole : undefined,
      status: newStatus !== "no_change" ? newStatus : undefined,
    });
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
