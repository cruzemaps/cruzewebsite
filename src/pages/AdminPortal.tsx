import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, ShieldAlert, Users, FileCheck, History, Mail, FileSignature, Archive } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import UsersTab from "@/components/admin/UsersTab";
import PilotsTab from "@/components/admin/PilotsTab";
import AuditTab from "@/components/admin/AuditTab";
import InvitationsTab from "@/components/admin/InvitationsTab";
import LOIsTab from "@/components/admin/LOIsTab";
import ArchiveLibraryTab from "@/components/admin/ArchiveLibraryTab";

const AdminPortal = () => {
  const { user, signOut } = useAuth();
  const [counts, setCounts] = useState({ users: 0, pendingPilots: 0, openInvites: 0, lois: 0 });
  const isDemo = !!(sessionStorage.getItem("demo_role") || localStorage.getItem("demo_role"));

  useEffect(() => {
    if (isDemo) {
      setCounts({ users: 42, pendingPilots: 7, openInvites: 3, lois: 12 });
      return;
    }
    (async () => {
      const [{ count: users }, { count: pendingPilots }, { count: openInvites }, { count: lois }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("pilot_applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("invitations").select("*", { count: "exact", head: true }).is("accepted_at", null),
        supabase.from("loi_signatures").select("*", { count: "exact", head: true }),
      ]);
      setCounts({ users: users || 0, pendingPilots: pendingPilots || 0, openInvites: openInvites || 0, lois: lois || 0 });
    })();
  }, [isDemo]);

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white">
      <nav className="sticky top-0 z-50 px-6 py-4 border-b border-white/5 bg-[#0B0E14]/80 backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="inline-flex items-center justify-center p-2 rounded-full hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white/70" />
          </Link>
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Cruze" className="h-8 w-auto opacity-90" />
            <div className="h-4 w-px bg-white/20" />
            <span className="font-display font-medium text-lg tracking-wide flex items-center gap-2">
              <ShieldAlert size={16} className="text-brand-orange" /> Admin Portal
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-white/40 hidden md:inline">{user?.email}</span>
          <button onClick={signOut} className="px-3 py-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/5">
            Sign out
          </button>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Operations Hub</h1>
          <p className="text-white/50">User management, pilot pipeline, audit trail.</p>
        </div>

        {isDemo && (
          <div className="mb-6 p-4 rounded-lg border border-brand-orange/30 bg-brand-orange/5 text-sm text-brand-orange">
            Demo mode active. Actions display locally; nothing writes to Supabase.
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Stat icon={<Users size={18} />} label="Users" value={counts.users} />
          <Stat icon={<FileCheck size={18} />} label="Pending pilots" value={counts.pendingPilots} />
          <Stat icon={<Mail size={18} />} label="Open invitations" value={counts.openInvites} />
          <Stat icon={<FileSignature size={18} />} label="Signed LOIs" value={counts.lois} />
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="bg-[#0F131C] border border-white/10">
            <TabsTrigger value="users" className="data-[state=active]:bg-brand-cyan/10 data-[state=active]:text-brand-cyan">
              <Users size={14} className="mr-2" /> Users
            </TabsTrigger>
            <TabsTrigger value="pilots" className="data-[state=active]:bg-brand-cyan/10 data-[state=active]:text-brand-cyan">
              <FileCheck size={14} className="mr-2" /> Pilots
            </TabsTrigger>
            <TabsTrigger value="invitations" className="data-[state=active]:bg-brand-cyan/10 data-[state=active]:text-brand-cyan">
              <Mail size={14} className="mr-2" /> Invitations
            </TabsTrigger>
            <TabsTrigger value="lois" className="data-[state=active]:bg-brand-cyan/10 data-[state=active]:text-brand-cyan">
              <FileSignature size={14} className="mr-2" /> LOIs
            </TabsTrigger>
            <TabsTrigger value="archive" className="data-[state=active]:bg-brand-cyan/10 data-[state=active]:text-brand-cyan">
              <Archive size={14} className="mr-2" /> Archive
            </TabsTrigger>
            <TabsTrigger value="audit" className="data-[state=active]:bg-brand-cyan/10 data-[state=active]:text-brand-cyan">
              <History size={14} className="mr-2" /> Audit
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <UsersTab isDemo={isDemo} />
          </TabsContent>
          <TabsContent value="pilots" className="mt-6">
            <PilotsTab isDemo={isDemo} />
          </TabsContent>
          <TabsContent value="invitations" className="mt-6">
            <InvitationsTab isDemo={isDemo} />
          </TabsContent>
          <TabsContent value="lois" className="mt-6">
            <LOIsTab isDemo={isDemo} />
          </TabsContent>
          <TabsContent value="archive" className="mt-6">
            <ArchiveLibraryTab isDemo={isDemo} />
          </TabsContent>
          <TabsContent value="audit" className="mt-6">
            <AuditTab isDemo={isDemo} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card className="bg-[#0F131C] border-white/10">
      <CardContent className="p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-brand-cyan/10 text-brand-cyan flex items-center justify-center">{icon}</div>
        <div>
          <div className="font-display text-2xl font-bold">{value.toLocaleString()}</div>
          <div className="text-white/50 text-xs">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AdminPortal;
