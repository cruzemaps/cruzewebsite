import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, Building2, Truck, Route } from "lucide-react";
import { toast } from "sonner";

type RoleType = "fleet_owner" | "city_operator";

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<RoleType>("fleet_owner");
  
  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const location = useLocation();

  // Hidden URL bypass mechanism. Dev-only: gating behind import.meta.env.DEV
  // means production builds completely strip this branch — a real user can't
  // accidentally activate a demo role by visiting a crafted URL. Uses
  // sessionStorage (per-tab) so demo state can't bleed into other tabs of
  // the same admin session.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const params = new URLSearchParams(location.search);
    const demo = params.get('demo');
    if (demo === 'admin') {
      sessionStorage.setItem("demo_role", "admin");
      window.location.href = "/admin";
    } else if (demo === 'fleet_owner' || demo === 'city_operator') {
      sessionStorage.setItem("demo_role", demo);
      window.location.href = demo === 'city_operator' ? "/dashboard" : "/fleet-dashboard";
    }
  }, [location.search]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (isSignUp) {
      if (!firstName || !lastName || !email || !password) {
        toast.error("Please fill out all fields.");
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            role,
            first_name: firstName,
            last_name: lastName
          }
        }
      });
      if (error) toast.error(error.message);
      else {
        toast.success("Pilot application initiated! Check your email to verify (or sign in if confirm email is off).");
        setIsSignUp(false); // Switch back to sign in
      }
    } else {
      // Standard login. We read role from the JWT custom claim (app_role)
      // not from user_metadata — user_metadata is user-controllable at signup
      // and trusting it would re-open the privilege-escalation hole that
      // migration 001 closed. JWT claims come from profiles.role, which
      // only admins can change.
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message || "Invalid login credentials");
      } else {
        toast.success("Successfully logged in");
        let appRole: string | undefined;
        try {
          if (data.session?.access_token) {
            const payload = JSON.parse(atob(data.session.access_token.split(".")[1]));
            appRole = payload.app_role;
          }
        } catch { /* fall through to default redirect */ }

        if (appRole === 'admin') window.location.href = "/admin";
        else if (appRole === 'city_operator') window.location.href = "/dashboard";
        else window.location.href = "/fleet-dashboard";
      }
    }
    
    setLoading(false);
  };

  const handleOAuth = async (provider: 'google') => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        // After OAuth, land on a generic post-signin route. The Login form
        // post-signin handler reads JWT app_role and routes by role; for
        // OAuth we don't have the JWT before the redirect happens, so we
        // bounce through /admin which ProtectedRoute will reroute by role.
        redirectTo: `${window.location.origin}/admin`,
      }
    });
    if (error) toast.error(`Failed to connect to ${provider}: ${error.message}`);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-orange/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-brand-cyan/20 rounded-full blur-[150px] pointer-events-none" />

      <nav className="absolute top-0 w-full p-6 z-50 flex items-center justify-between pointer-events-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors group relative">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium tracking-wide">Back to Home</span>
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10 mt-12 sm:mt-0">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative"
        >
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-3 justify-center mb-4">
              <Route className="w-8 h-8 text-brand-orange" />
              <span className="font-display font-bold text-2xl tracking-wide">CRUZE</span>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight mb-2">
              {isSignUp ? "Register Network Node" : "Access Portal"}
            </h1>
            <p className="text-white/60 text-sm">
              {isSignUp 
                ? "Provide your details to initiate a pilot integration." 
                : "Sign in securely to manage your fleet deployments."}
            </p>
          </div>

          <AnimatePresence mode="popLayout">
            <motion.div
              key={isSignUp ? "signup" : "signin"}
              initial={{ opacity: 0, x: isSignUp ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isSignUp ? -20 : 20 }}
              transition={{ duration: 0.3 }}
            >
              <form onSubmit={handleAuth} className="space-y-4">
                
                {isSignUp && (
                  <>
                    <div className="flex items-center gap-4">
                       <div className="space-y-2 flex-1">
                         <Label className="text-white/80">First Name</Label>
                         <Input
                           required
                           value={firstName}
                           onChange={(e) => setFirstName(e.target.value)}
                           className="bg-white/5 border-white/10 text-white"
                           placeholder="John"
                         />
                       </div>
                       <div className="space-y-2 flex-1">
                         <Label className="text-white/80">Last Name</Label>
                         <Input
                           required
                           value={lastName}
                           onChange={(e) => setLastName(e.target.value)}
                           className="bg-white/5 border-white/10 text-white"
                           placeholder="Doe"
                         />
                       </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <Label className="text-white/80">Select Integration Type</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div 
                          className={`cursor-pointer rounded-xl p-4 border transition-all ${role === 'fleet_owner' ? 'border-brand-orange bg-brand-orange/10' : 'border-white/10 bg-white/5 hover:border-white/30'}`}
                          onClick={() => setRole('fleet_owner')}
                        >
                          <Truck className={`w-5 h-5 mb-2 ${role === 'fleet_owner' ? 'text-brand-orange' : 'text-white/50'}`} />
                          <div className={`font-medium text-sm ${role === 'fleet_owner' ? 'text-brand-orange' : 'text-white/70'}`}>Fleet Owner</div>
                        </div>
                        <div 
                          className={`cursor-pointer rounded-xl p-4 border transition-all ${role === 'city_operator' ? 'border-brand-cyan bg-brand-cyan/10' : 'border-white/10 bg-white/5 hover:border-white/30'}`}
                          onClick={() => setRole('city_operator')}
                        >
                          <Building2 className={`w-5 h-5 mb-2 ${role === 'city_operator' ? 'text-brand-cyan' : 'text-white/50'}`} />
                          <div className={`font-medium text-sm ${role === 'city_operator' ? 'text-brand-cyan' : 'text-white/70'}`}>City Operator</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label className="text-white/80">Email</Label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="name@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Password</Label>
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="••••••••"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-white text-black hover:bg-white/90 mt-4">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isSignUp ? "Initiate Pilot" : "Sign In")}
                </Button>
              </form>

              {!isSignUp && (
                <>
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#1A1F2B] px-2 text-white/50 ring-1 ring-white/10 rounded-full">Or single sign-on with</span></div>
                  </div>

                  <div className="flex flex-col gap-4 mb-4">
                    <Button variant="outline" type="button" onClick={() => handleOAuth('google')} className="bg-transparent border-white/10 text-white hover:bg-white/5 hover:border-brand-cyan/50 transition-colors">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 mr-2" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Sign In with Google
                    </Button>
                  </div>
                </>
              )}

              <div className="text-center mt-6">
                <button 
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)} 
                  className="text-sm text-white/50 hover:text-white underline underline-offset-4 transition-colors"
                >
                  {isSignUp ? "Already a verified operator? Sign in here." : "Don't have an account? Register new node."}
                </button>
              </div>

            </motion.div>
          </AnimatePresence>

          {import.meta.env.DEV && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="text-xs uppercase tracking-widest text-brand-cyan/80 mb-3 text-center">
                Dev demo access
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(["admin", "fleet_owner", "city_operator"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      sessionStorage.setItem("demo_role", r);
                      window.location.href =
                        r === "admin" ? "/admin" : r === "city_operator" ? "/dashboard" : "/fleet-dashboard";
                    }}
                    className="text-xs py-2 px-2 rounded-md border border-brand-cyan/20 bg-brand-cyan/5 hover:bg-brand-cyan/10 hover:border-brand-cyan/40 transition-colors"
                  >
                    {r === "fleet_owner" ? "Fleet" : r === "city_operator" ? "City" : "Admin"}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-white/30 text-center mt-2">
                Local development only. Buttons are hidden in production builds.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
