import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, Building2, Truck, Mail } from "lucide-react";
import { toast } from "sonner";

type RoleType = "fleet_owner" | "city_operator" | null;

const Login = () => {
  const [role, setRole] = useState<RoleType>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // To toggle between Sign In and Sign Up if they want to make an account
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (isSignUp) {
      // Create new pilot account with metadata
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role } // Supabase passes this to raw_user_meta_data
        }
      });
      if (error) toast.error(error.message);
      else {
        toast.success("Pilot application initiated! Check your email to verify.");
        // Normally redirect to fleet dashboard after verification
      }
    } else {
      // Standard login
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message || "Invalid login credentials");
      } else {
        toast.success("Successfully logged in");
        
        // Check their role from our profiles table, or session metadata
        const userRole = data.user?.user_metadata?.role || 'fleet_owner';
        if (userRole === 'admin') navigate("/admin");
        else if (userRole === 'city_operator') navigate("/dashboard");
        else navigate("/fleet-dashboard"); // Fleet Owner
      }
    }
    
    setLoading(false);
  };

  const handleOAuth = async (provider: 'google' | 'azure') => {
    toast.info(`Connecting to ${provider}...`);
    // Placeholder for actual OAuth call
    // await supabase.auth.signInWithOAuth({ provider, options: { queryParams: { role } } });
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-orange/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-brand-cyan/20 rounded-full blur-[150px] pointer-events-none" />

      <nav className="absolute top-0 w-full p-6 z-10 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium tracking-wide">Back to Home</span>
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center p-6 z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative"
        >
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-3 justify-center mb-4">
              <img src="/logo.png" alt="Cruze Logo" className="h-10 w-auto" />
              <span className="font-display font-bold text-2xl tracking-wide">CRUZE</span>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight mb-2">Access Portal</h1>
            <p className="text-white/60 text-sm">Select your organizational structure to continue</p>
          </div>

          <AnimatePresence mode="wait">
            {!role ? (
              <motion.div 
                key="role-selection"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <button
                  onClick={() => { setRole("fleet_owner"); setIsSignUp(true); }}
                  className="bg-white/5 border border-white/10 hover:border-brand-orange/50 rounded-xl p-6 text-left transition-all hover:bg-white/10 group"
                >
                  <Truck className="w-8 h-8 text-brand-orange mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-lg mb-1">Fleet Owner</h3>
                  <p className="text-sm text-white/50">Start a pilot, manage your vehicles, and view ROI telemetry.</p>
                </button>
                <button
                  onClick={() => { setRole("city_operator"); setIsSignUp(true); }}
                  className="bg-white/5 border border-white/10 hover:border-brand-cyan/50 rounded-xl p-6 text-left transition-all hover:bg-white/10 group"
                >
                  <Building2 className="w-8 h-8 text-brand-cyan mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-lg mb-1">City Operator</h3>
                  <p className="text-sm text-white/50">View network flow matrices and regional pacing active deployments.</p>
                </button>
                
                <div className="md:col-span-2 text-center mt-4">
                   <button onClick={() => { setRole("fleet_owner"); setIsSignUp(false); }} className="text-sm text-white/50 hover:text-white underline underline-offset-4">
                     Already have an account? Sign in here.
                   </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="auth-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <button onClick={() => setRole(null)} className="text-white/50 hover:text-white text-sm flex items-center gap-1 mb-6">
                  <ArrowLeft className="w-4 h-4" /> Change Role
                </button>

                <form onSubmit={handleAuth} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white/80">Email</Label>
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
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
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-white text-black hover:bg-white/90">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isSignUp ? "Begin Pilot Application" : "Sign In Securely")}
                  </Button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#1A1F2B] px-2 text-white/50 ring-1 ring-white/10 rounded-full">Or continue with</span></div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Button variant="outline" onClick={() => handleOAuth('google')} className="bg-transparent border-white/10 text-white hover:bg-white/5">
                    Google
                  </Button>
                  <Button variant="outline" onClick={() => handleOAuth('azure')} className="bg-transparent border-white/10 text-white hover:bg-white/5">
                    Microsoft
                  </Button>
                </div>

                <div className="text-center mt-6 p-4 border border-brand-cyan/20 bg-brand-cyan/5 rounded-xl">
                   <p className="text-xs text-brand-cyan mb-2">Simulation Mode Active</p>
                   <Button 
                     variant="ghost" 
                     className="text-white hover:text-brand-cyan text-xs w-full"
                     onClick={() => {
                       const selectedRole = role || "fleet_owner";
                       localStorage.setItem("demo_role", selectedRole);
                       window.location.href = selectedRole === "city_operator" ? "/dashboard" : "/fleet-dashboard";
                     }}
                   >
                     Test {role === 'fleet_owner' ? 'Fleet Owner' : 'City Operator'} Dashboard
                   </Button>
                   <Button 
                     variant="ghost" 
                     className="text-white hover:text-red-400 text-xs w-full mt-1"
                     onClick={() => {
                       localStorage.setItem("demo_role", "admin");
                       window.location.href = "/admin";
                     }}
                   >
                     Test Admin Portal
                   </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
