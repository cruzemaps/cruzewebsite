import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Archive,
  ArchiveRestore,
  Trash2,
  Users as UsersIcon,
  FileCheck,
  Mail,
  FileSignature,
  AlertTriangle,
  ShieldOff,
  ExternalLink,
} from "lucide-react";

// One unified place to view + manage all archived/soft-deleted records.
// Sub-tabs: Users, Pilots, Invitations, LOIs.
// Each row supports: Restore, Permanently delete (with type-to-confirm).

type ArchivedUser = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: string;
  status: string;
  last_active_at: string | null;
};

type ArchivedPilot = {
  id: string;
  user_id: string;
  company_name: string | null;
  fleet_size: string | null;
  truck_size: string | null;
  status: string;
  created_at: string;
};

type ArchivedLOI = {
  id: string;
  user_id: string;
  participant_name: string;
  participant_company: string;
  fleet_size: string;
  signed_at: string;
  archived_at: string | null;
  archive_reason: string | null;
};

type ArchivedInvite = {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
};

export default function ArchiveLibraryTab({ isDemo }: { isDemo: boolean }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3">
        <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-200/90 leading-relaxed">
          <strong className="text-amber-300">Archive vs. permanent delete.</strong>{" "}
          Archived records stay in the database and can be restored at any time. Permanent delete
          removes the row completely; the action is captured in the deletion audit log but the
          original data is gone. Use permanent delete only for test data, duplicates, or
          GDPR/CCPA-style requests.
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="bg-[#0F131C] border border-white/10">
          <TabsTrigger value="users" className="data-[state=active]:bg-brand-cyan/10 data-[state=active]:text-brand-cyan">
            <UsersIcon size={14} className="mr-2" /> Users
          </TabsTrigger>
          <TabsTrigger value="pilots" className="data-[state=active]:bg-brand-cyan/10 data-[state=active]:text-brand-cyan">
            <FileCheck size={14} className="mr-2" /> Pilots
          </TabsTrigger>
          <TabsTrigger value="invites" className="data-[state=active]:bg-brand-cyan/10 data-[state=active]:text-brand-cyan">
            <Mail size={14} className="mr-2" /> Invitations
          </TabsTrigger>
          <TabsTrigger value="lois" className="data-[state=active]:bg-brand-cyan/10 data-[state=active]:text-brand-cyan">
            <FileSignature size={14} className="mr-2" /> LOIs
          </TabsTrigger>
          <TabsTrigger value="audit" className="data-[state=active]:bg-brand-cyan/10 data-[state=active]:text-brand-cyan">
            <ShieldOff size={14} className="mr-2" /> Deletion log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4"><UsersSection isDemo={isDemo} /></TabsContent>
        <TabsContent value="pilots" className="mt-4"><PilotsSection isDemo={isDemo} /></TabsContent>
        <TabsContent value="invites" className="mt-4"><InvitesSection isDemo={isDemo} /></TabsContent>
        <TabsContent value="lois" className="mt-4"><LOIsSection isDemo={isDemo} /></TabsContent>
        <TabsContent value="audit" className="mt-4"><DeletionLogSection isDemo={isDemo} /></TabsContent>
      </Tabs>
    </div>
  );
}

// -------- Sections --------

function UsersSection({ isDemo }: { isDemo: boolean }) {
  const [items, setItems] = useState<ArchivedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<ArchivedUser | null>(null);

  const load = async () => {
    setLoading(true);
    if (isDemo) {
      setItems([{ id: "u-demo", email: "old@example.com", first_name: "Old", last_name: "User", role: "fleet_owner", status: "archived", last_active_at: null }]);
      setLoading(false);
      return;
    }
    const { data } = await supabase.from("profiles").select("id, email, first_name, last_name, role, status, last_active_at").eq("status", "archived").order("last_active_at", { ascending: false });
    setItems((data as ArchivedUser[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [isDemo]);

  const restore = async (u: ArchivedUser) => {
    const reason = prompt(`Restore ${u.email} to active status?`);
    if (!reason || reason.length < 3) return;
    if (isDemo) {
      setItems((prev) => prev.filter((p) => p.id !== u.id));
      toast.success("Demo: restored locally");
      return;
    }
    const { error } = await supabase.rpc("change_user_role", { target_user_id: u.id, new_role: u.role, new_status: "active", reason });
    if (error) return toast.error(error.message);
    setItems((prev) => prev.filter((p) => p.id !== u.id));
    toast.success(`${u.email} restored.`);
  };

  return (
    <SectionWrap loading={loading} count={items.length} emptyText="No archived users.">
      <Table>
        <THead cols={["User", "Role", "Last active", ""]} />
        <tbody>
          {items.map((u) => (
            <tr key={u.id} className="border-b border-white/5">
              <td className="py-3 px-2">
                <div className="font-medium">{u.first_name} {u.last_name}</div>
                <div className="text-white/40 text-xs">{u.email}</div>
              </td>
              <td className="py-3 px-2 text-white/70">{u.role}</td>
              <td className="py-3 px-2 text-white/50 text-xs">{u.last_active_at ? new Date(u.last_active_at).toLocaleDateString() : "Never"}</td>
              <td className="py-3 px-2 text-right whitespace-nowrap">
                <Button size="sm" variant="ghost" onClick={() => restore(u)} className="text-emerald-400 hover:text-emerald-300">
                  <ArchiveRestore size={14} className="mr-1" /> Restore
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(u)} className="text-red-400 hover:text-red-300">
                  <Trash2 size={14} className="mr-1" /> Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      {confirmDelete && (
        <HardDeleteDialog
          title="Permanently delete user"
          warning={`This will permanently delete ${confirmDelete.email} and ALL their pilot applications, invitations, LOIs, and role history. The original data cannot be recovered.`}
          confirmText={confirmDelete.email || ""}
          minReasonLength={10}
          rpcName="admin_hard_delete_user"
          rpcArgs={{ p_user_id: confirmDelete.id }}
          isDemo={isDemo}
          onClose={() => setConfirmDelete(null)}
          onSuccess={() => {
            setItems((prev) => prev.filter((p) => p.id !== confirmDelete.id));
            setConfirmDelete(null);
          }}
        />
      )}
    </SectionWrap>
  );
}

function PilotsSection({ isDemo }: { isDemo: boolean }) {
  const [items, setItems] = useState<ArchivedPilot[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<ArchivedPilot | null>(null);

  const load = async () => {
    setLoading(true);
    if (isDemo) {
      setItems([{ id: "p-demo", user_id: "u1", company_name: "Old Logistics", fleet_size: "100", truck_size: "Class 8", status: "archived", created_at: "2026-01-01T00:00:00Z" }]);
      setLoading(false);
      return;
    }
    const { data } = await supabase.from("pilot_applications").select("*").eq("status", "archived").order("created_at", { ascending: false });
    setItems((data as ArchivedPilot[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [isDemo]);

  const restore = async (p: ArchivedPilot) => {
    if (!confirm(`Restore "${p.company_name}" to pending status?`)) return;
    if (isDemo) {
      setItems((prev) => prev.filter((x) => x.id !== p.id));
      toast.success("Demo: restored locally");
      return;
    }
    const { error } = await supabase.from("pilot_applications").update({ status: "pending" }).eq("id", p.id);
    if (error) return toast.error(error.message);
    setItems((prev) => prev.filter((x) => x.id !== p.id));
    toast.success("Pilot restored to pending.");
  };

  return (
    <SectionWrap loading={loading} count={items.length} emptyText="No archived pilot applications.">
      <Table>
        <THead cols={["Company", "Fleet", "Created", ""]} />
        <tbody>
          {items.map((p) => (
            <tr key={p.id} className="border-b border-white/5">
              <td className="py-3 px-2">
                <div className="font-medium">{p.company_name || "(unnamed)"}</div>
                <div className="text-white/40 text-xs font-mono">{p.id.slice(0, 8)}…</div>
              </td>
              <td className="py-3 px-2 text-white/70">{p.fleet_size || "?"} · {p.truck_size || "?"}</td>
              <td className="py-3 px-2 text-white/50 text-xs">{new Date(p.created_at).toLocaleDateString()}</td>
              <td className="py-3 px-2 text-right whitespace-nowrap">
                <Button size="sm" variant="ghost" onClick={() => restore(p)} className="text-emerald-400 hover:text-emerald-300">
                  <ArchiveRestore size={14} className="mr-1" /> Restore
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(p)} className="text-red-400 hover:text-red-300">
                  <Trash2 size={14} className="mr-1" /> Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      {confirmDelete && (
        <HardDeleteDialog
          title="Permanently delete pilot application"
          warning={`This permanently deletes the pilot application from "${confirmDelete.company_name}". Their LOI signature is unaffected.`}
          confirmText={confirmDelete.company_name || confirmDelete.id.slice(0, 8)}
          minReasonLength={5}
          rpcName="admin_hard_delete_pilot_application"
          rpcArgs={{ p_id: confirmDelete.id }}
          isDemo={isDemo}
          onClose={() => setConfirmDelete(null)}
          onSuccess={() => {
            setItems((prev) => prev.filter((x) => x.id !== confirmDelete.id));
            setConfirmDelete(null);
          }}
        />
      )}
    </SectionWrap>
  );
}

function InvitesSection({ isDemo }: { isDemo: boolean }) {
  const [items, setItems] = useState<ArchivedInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<ArchivedInvite | null>(null);

  const load = async () => {
    setLoading(true);
    if (isDemo) {
      setItems([{ id: "i-demo", email: "old@invite.com", role: "fleet_owner", expires_at: "2025-01-01T00:00:00Z", accepted_at: null, created_at: "2024-12-01T00:00:00Z" }]);
      setLoading(false);
      return;
    }
    const now = new Date().toISOString();
    const { data } = await supabase
      .from("invitations")
      .select("*")
      .or(`accepted_at.not.is.null,expires_at.lt.${now}`)
      .order("created_at", { ascending: false });
    setItems((data as ArchivedInvite[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [isDemo]);

  return (
    <SectionWrap loading={loading} count={items.length} emptyText="No accepted or expired invitations.">
      <Table>
        <THead cols={["Email", "Role", "Status", ""]} />
        <tbody>
          {items.map((i) => {
            const expired = !i.accepted_at && new Date(i.expires_at) < new Date();
            return (
              <tr key={i.id} className="border-b border-white/5">
                <td className="py-3 px-2 font-medium">{i.email}</td>
                <td className="py-3 px-2 text-white/70">{i.role}</td>
                <td className="py-3 px-2">
                  {i.accepted_at ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Accepted {new Date(i.accepted_at).toLocaleDateString()}</span>
                  ) : expired ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">Expired</span>
                  ) : (
                    <span className="text-xs text-white/40">Pending</span>
                  )}
                </td>
                <td className="py-3 px-2 text-right whitespace-nowrap">
                  <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(i)} className="text-red-400 hover:text-red-300">
                    <Trash2 size={14} className="mr-1" /> Delete
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      {confirmDelete && (
        <HardDeleteDialog
          title="Permanently delete invitation"
          warning={`This removes the invitation row for ${confirmDelete.email}.`}
          confirmText={confirmDelete.email}
          minReasonLength={5}
          rpcName="admin_hard_delete_invitation"
          rpcArgs={{ p_id: confirmDelete.id }}
          isDemo={isDemo}
          onClose={() => setConfirmDelete(null)}
          onSuccess={() => {
            setItems((prev) => prev.filter((x) => x.id !== confirmDelete.id));
            setConfirmDelete(null);
          }}
        />
      )}
    </SectionWrap>
  );
}

function LOIsSection({ isDemo }: { isDemo: boolean }) {
  const [items, setItems] = useState<ArchivedLOI[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<ArchivedLOI | null>(null);

  const load = async () => {
    setLoading(true);
    if (isDemo) {
      setItems([{ id: "loi-demo", user_id: "u1", participant_name: "Test Signer", participant_company: "Old Co", fleet_size: "100", signed_at: "2026-01-01T00:00:00Z", archived_at: "2026-02-01T00:00:00Z", archive_reason: "Customer requested withdrawal" }]);
      setLoading(false);
      return;
    }
    const { data } = await supabase.from("loi_signatures").select("id, user_id, participant_name, participant_company, fleet_size, signed_at, archived_at, archive_reason").not("archived_at", "is", null).order("archived_at", { ascending: false });
    setItems((data as ArchivedLOI[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [isDemo]);

  const restore = async (l: ArchivedLOI) => {
    if (!confirm(`Restore the LOI signed by ${l.participant_name}? It will reappear in the active LOIs list.`)) return;
    if (isDemo) {
      setItems((prev) => prev.filter((x) => x.id !== l.id));
      toast.success("Demo: restored locally");
      return;
    }
    const { error } = await supabase.rpc("restore_loi", { p_loi_id: l.id });
    if (error) return toast.error(error.message);
    setItems((prev) => prev.filter((x) => x.id !== l.id));
    toast.success("LOI restored.");
  };

  return (
    <SectionWrap loading={loading} count={items.length} emptyText="No archived LOIs.">
      <Table>
        <THead cols={["Participant / Company", "Archived", "Reason", ""]} />
        <tbody>
          {items.map((l) => (
            <tr key={l.id} className="border-b border-white/5">
              <td className="py-3 px-2">
                <div className="font-medium">{l.participant_name}</div>
                <div className="text-white/40 text-xs">{l.participant_company}</div>
              </td>
              <td className="py-3 px-2 text-white/50 text-xs whitespace-nowrap">
                {l.archived_at ? new Date(l.archived_at).toLocaleDateString() : "—"}
              </td>
              <td className="py-3 px-2 text-white/60 text-xs max-w-[280px] truncate">{l.archive_reason}</td>
              <td className="py-3 px-2 text-right whitespace-nowrap">
                <Button asChild size="sm" variant="ghost" className="text-brand-cyan hover:bg-white/5">
                  <Link to={`/loi/${l.id}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={12} className="mr-1" /> View
                  </Link>
                </Button>
                <Button size="sm" variant="ghost" onClick={() => restore(l)} className="text-emerald-400 hover:text-emerald-300">
                  <ArchiveRestore size={14} className="mr-1" /> Restore
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(l)} className="text-red-400 hover:text-red-300">
                  <Trash2 size={14} className="mr-1" /> Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      {confirmDelete && (
        <HardDeleteDialog
          title="Permanently delete LOI"
          warning={`This permanently removes the LOI signed by ${confirmDelete.participant_name} (${confirmDelete.participant_company}). Cruzemaps will lose its copy of the signed document. Use only for test data or court-ordered erasure.`}
          confirmText="DELETE LOI"
          minReasonLength={10}
          rpcName="admin_hard_delete_loi"
          rpcArgs={{ p_id: confirmDelete.id }}
          isDemo={isDemo}
          onClose={() => setConfirmDelete(null)}
          onSuccess={() => {
            setItems((prev) => prev.filter((x) => x.id !== confirmDelete.id));
            setConfirmDelete(null);
          }}
        />
      )}
    </SectionWrap>
  );
}

function DeletionLogSection({ isDemo }: { isDemo: boolean }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (isDemo) {
        setItems([{ id: "del1", entity_type: "user", entity_id: "u1", reason: "Test cleanup", deleted_at: new Date().toISOString() }]);
        setLoading(false);
        return;
      }
      const { data } = await supabase.from("permanent_deletions").select("*").order("deleted_at", { ascending: false }).limit(100);
      setItems(data || []);
      setLoading(false);
    })();
  }, [isDemo]);

  return (
    <SectionWrap loading={loading} count={items.length} emptyText="Nothing has been permanently deleted yet.">
      <Table>
        <THead cols={["Type", "ID", "Reason", "Deleted at"]} />
        <tbody>
          {items.map((d) => (
            <tr key={d.id} className="border-b border-white/5">
              <td className="py-3 px-2">
                <span className="text-[10px] uppercase tracking-widest font-semibold text-red-400 bg-red-400/10 border border-red-400/30 px-2 py-0.5 rounded-full">
                  {d.entity_type.replace("_", " ")}
                </span>
              </td>
              <td className="py-3 px-2 text-white/50 text-xs font-mono">{d.entity_id.slice(0, 12)}…</td>
              <td className="py-3 px-2 text-white/70 text-sm max-w-[400px]">{d.reason}</td>
              <td className="py-3 px-2 text-white/50 text-xs whitespace-nowrap">
                {new Date(d.deleted_at).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </SectionWrap>
  );
}

// -------- Shared bits --------

function SectionWrap({ children, loading, count, emptyText }: { children: React.ReactNode; loading: boolean; count: number; emptyText: string }) {
  return (
    <Card className="bg-[#0F131C] border-white/10">
      <CardContent className="p-6">
        {loading ? (
          <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-brand-cyan" /></div>
        ) : count === 0 ? (
          <div className="py-12 text-center text-white/40">
            <Archive className="mx-auto mb-2 opacity-50" />
            {emptyText}
          </div>
        ) : (
          <div className="overflow-x-auto">{children}</div>
        )}
      </CardContent>
    </Card>
  );
}

function Table({ children }: { children: React.ReactNode }) {
  return <table className="w-full text-sm">{children}</table>;
}

function THead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr className="text-left text-white/50 border-b border-white/5">
        {cols.map((c, i) => (
          <th key={i} className="py-3 px-2 font-medium">{c}</th>
        ))}
      </tr>
    </thead>
  );
}

function HardDeleteDialog({
  title,
  warning,
  confirmText,
  minReasonLength,
  rpcName,
  rpcArgs,
  isDemo,
  onClose,
  onSuccess,
}: {
  title: string;
  warning: string;
  confirmText: string;
  minReasonLength: number;
  rpcName: string;
  rpcArgs: Record<string, any>;
  isDemo: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [reason, setReason] = useState("");
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);

  const canDelete = reason.trim().length >= minReasonLength && typed === confirmText;

  const submit = async () => {
    if (!canDelete) return;
    setBusy(true);
    if (isDemo) {
      toast.success("Demo: would have permanently deleted");
      setBusy(false);
      onSuccess();
      return;
    }
    const { error } = await supabase.rpc(rpcName, { ...rpcArgs, p_reason: reason });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Permanently deleted.");
    onSuccess();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-[#0B0E14] border-red-500/30 text-white">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2 text-red-400">
            <Trash2 size={18} /> {title}
          </DialogTitle>
          <DialogDescription className="text-white/60">{warning}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-white/70 text-sm mb-2 block">
              Type <code className="text-red-400 font-mono">{confirmText}</code> to confirm
            </Label>
            <Input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={confirmText}
              className="bg-white/5 border-white/10 text-white font-mono"
            />
          </div>
          <div>
            <Label className="text-white/70 text-sm mb-2 block">Reason for permanent deletion *</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder={`At least ${minReasonLength} characters. e.g. 'Customer requested data erasure under CCPA on 5/6.'`}
              className="bg-white/5 border-white/10 text-white"
            />
            <p className="text-[11px] text-white/40 mt-1">
              The reason is captured in the deletion audit log along with a snapshot of the deleted row.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={submit}
            disabled={!canDelete || busy}
            className="bg-red-500 text-white hover:bg-red-500/90 font-bold"
          >
            {busy && <Loader2 className="animate-spin mr-2" size={14} />} Permanently delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
