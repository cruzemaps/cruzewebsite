import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Mail, Plus, Copy, Check } from "lucide-react";
import { SITE } from "@/lib/seo";
import { useAuth } from "@/hooks/useAuth";

type Invite = {
  id: string;
  email: string;
  role: "admin" | "fleet_owner" | "city_operator";
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
};

const DEMO_INVITES: Invite[] = [
  { id: "i1", email: "new.investor@example.com", role: "admin", token: "demo-token-1", expires_at: "2026-05-11T00:00:00Z", accepted_at: null, created_at: "2026-05-04T00:00:00Z" },
];

export default function InvitationsTab({ isDemo }: { isDemo: boolean }) {
  const { user } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Invite["role"]>("fleet_owner");
  const [copied, setCopied] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const load = async () => {
    setLoading(true);
    if (isDemo) {
      setInvites(DEMO_INVITES);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("invitations")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setInvites((data as Invite[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [isDemo]);

  const create = async () => {
    if (!email.includes("@")) return toast.error("Enter a valid email.");
    setCreating(true);
    if (isDemo) {
      const fake: Invite = {
        id: `demo-${Math.random().toString(36).slice(2, 8)}`,
        email,
        role,
        token: `demo-${Math.random().toString(36).slice(2, 12)}`,
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
        accepted_at: null,
        created_at: new Date().toISOString(),
      };
      setInvites([fake, ...invites]);
      setEmail("");
      setCreating(false);
      toast.success("Demo: invitation created locally.");
      return;
    }
    if (!user?.id) {
      setCreating(false);
      return toast.error("You must be signed in as an admin to create invitations.");
    }
    // Audit #40: optimistic insert. Use .select().single() so we get the
    // server-assigned id/token/expires_at back in one round trip and prepend
    // it to the local list — no second `load()` round trip, no flash of
    // stale data.
    const { data: row, error } = await supabase
      .from("invitations")
      .insert({ email, role, invited_by: user.id })
      .select("id, email, role, token, expires_at, accepted_at, created_at")
      .single();
    setCreating(false);
    if (error || !row) {
      return toast.error(error?.message ?? "Couldn't create invitation.");
    }
    setInvites((prev) => [row as Invite, ...prev]);
    setEmail("");
    toast.success("Invitation created. Send the link below to your invitee.");
  };

  const linkFor = (token: string) => `${SITE.url}/invite/${token}`;

  const copy = async (token: string) => {
    try {
      await navigator.clipboard.writeText(linkFor(token));
      setCopied(token);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Couldn't access clipboard. Copy manually: " + linkFor(token));
    }
  };

  return (
    <Card className="bg-[#0F131C] border-white/10">
      <CardContent className="p-6">
        <div className="grid md:grid-cols-[1fr_180px_auto] gap-3 mb-8">
          <div>
            <Label className="text-white/70 text-xs mb-1 block">Invitee email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="invitee@example.com"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <div>
            <Label className="text-white/70 text-xs mb-1 block">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Invite["role"])}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fleet_owner">Fleet owner</SelectItem>
                <SelectItem value="city_operator">City operator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={create} disabled={creating} className="bg-brand-cyan text-[#0B0E14] hover:bg-brand-cyan/90 w-full md:w-auto">
              {creating ? <Loader2 className="animate-spin mr-2" size={14} /> : <Plus size={14} className="mr-2" />} Create invite
            </Button>
          </div>
        </div>

        {(() => {
          const now = Date.now();
          const visibleInvites = showAll
            ? invites
            : invites.filter(
                (i) => !i.accepted_at && new Date(i.expires_at).getTime() >= now
              );
          const acceptedCount = invites.filter((i) => i.accepted_at).length;
          const expiredCount = invites.filter((i) => !i.accepted_at && new Date(i.expires_at).getTime() < now).length;
          return (
            <>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="text-xs text-white/50">
                  {showAll
                    ? `Showing all ${invites.length} invitations.`
                    : `Showing ${visibleInvites.length} pending. Hidden: ${acceptedCount} accepted, ${expiredCount} expired.`}
                </div>
                {(acceptedCount > 0 || expiredCount > 0) && (
                  <button
                    onClick={() => setShowAll((v) => !v)}
                    className="text-xs px-3 py-1 rounded-md border border-white/10 text-white/70 hover:border-white/20 hover:text-white"
                  >
                    {showAll ? "Hide accepted/expired" : "Show all (incl. accepted)"}
                  </button>
                )}
              </div>
        {loading ? (
          <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-brand-cyan" /></div>
        ) : visibleInvites.length === 0 ? (
          <div className="py-12 text-center text-white/40">
            <Mail className="mx-auto mb-2" />
            {invites.length === 0 ? "No invitations yet." : "No pending invitations. Click 'Show all' to view accepted/expired."}
          </div>
        ) : (
          <div className="space-y-3">
            {visibleInvites.map((inv) => {
              const expired = !inv.accepted_at && new Date(inv.expires_at) < new Date();
              return (
                <div key={inv.id} className="rounded-xl border border-white/10 bg-[#0B0E14] p-4 flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{inv.email}</div>
                    <div className="text-xs text-white/40 mt-1">
                      Role: <span className="text-white/70">{inv.role}</span> · Expires {new Date(inv.expires_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {inv.accepted_at ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Accepted</span>
                    ) : expired ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">Expired</span>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => copy(inv.token)} className="border-white/10 text-white">
                        {copied === inv.token ? <><Check size={12} className="mr-1.5" /> Copied</> : <><Copy size={12} className="mr-1.5" /> Copy link</>}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
            </>
          );
        })()}
      </CardContent>
    </Card>
  );
}
