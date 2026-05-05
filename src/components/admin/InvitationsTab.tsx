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
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Invite["role"]>("fleet_owner");
  const [copied, setCopied] = useState<string | null>(null);

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
    const { error } = await supabase.from("invitations").insert({ email, role });
    setCreating(false);
    if (error) return toast.error(error.message);
    setEmail("");
    toast.success("Invitation created. Send the link below to your invitee.");
    load();
  };

  const linkFor = (token: string) => `${SITE.url}/invite/${token}`;

  const copy = (token: string) => {
    navigator.clipboard.writeText(linkFor(token));
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
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

        {loading ? (
          <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-brand-cyan" /></div>
        ) : invites.length === 0 ? (
          <div className="py-12 text-center text-white/40">
            <Mail className="mx-auto mb-2" />
            No invitations yet.
          </div>
        ) : (
          <div className="space-y-3">
            {invites.map((inv) => {
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
      </CardContent>
    </Card>
  );
}
