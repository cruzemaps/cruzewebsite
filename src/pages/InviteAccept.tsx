import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SEO from "@/components/SEO";
import { ArrowRight, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { track } from "@/lib/analytics";

export default function InviteAccept() {
  const { token } = useParams<{ token: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [accepting, setAccepting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      // Pass the invite token to /login so the post-signin handler can route
      // back here and complete acceptance. (Audit #3)
      navigate(`/login?invite=${token}`, { replace: true });
    }
  }, [loading, user, token, navigate]);

  const accept = async () => {
    if (!token) return;
    setAccepting(true);
    const { data, error } = await supabase.rpc("accept_invitation", { invite_token: token });
    if (error) {
      setAccepting(false);
      return toast.error(error.message);
    }

    track("invitation_accepted", { role: data });

    // CRITICAL: refresh the JWT before navigating. accept_invitation just
    // updated profiles.role, but the user's existing JWT still carries the
    // OLD app_role claim. ProtectedRoute reads the JWT, sees the old role,
    // and bounces them away from the dashboard they just earned. Fixes
    // audit #4.
    try {
      await supabase.auth.refreshSession();
    } catch {
      // If refresh fails, the realtime subscription in useAuth will catch
      // the profile UPDATE and refresh on its own. Worst case: user has
      // to re-navigate once.
    }

    setAccepting(false);
    setDone(true);
    setTimeout(() => {
      if (data === "admin") navigate("/admin");
      else if (data === "city_operator") navigate("/dashboard");
      else navigate("/fleet-dashboard");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex items-center justify-center p-6">
      <SEO title="Accept Invitation | Cruze" noindex />
      <Card className="bg-[#0F131C] border-white/10 max-w-md w-full">
        <CardContent className="p-8">
          {done ? (
            <div className="text-center">
              <MailCheck className="mx-auto text-brand-cyan mb-4" size={48} />
              <h1 className="font-display text-2xl font-bold mb-2">You're in.</h1>
              <p className="text-white/60">Routing you to your dashboard…</p>
            </div>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold mb-3">You've been invited to Cruzemaps.</h1>
              <p className="text-white/60 mb-6">
                Accept the invitation to activate your account with the role assigned by the admin who invited you.
              </p>
              <Button onClick={accept} disabled={accepting} className="w-full bg-brand-cyan text-[#0B0E14] hover:bg-brand-cyan/90">
                {accepting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                Accept invitation <ArrowRight className="ml-2" size={16} />
              </Button>
              <p className="text-xs text-white/40 mt-4 text-center">
                Not the right account? <Link to="/login" className="text-brand-cyan hover:underline">Sign in as someone else</Link>.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
