import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // e.g. ['admin', 'fleet_owner', 'city_operator']
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (!user) {
        setRoleLoading(false);
        return;
      }
      
      // Attempt to load from the 'profiles' layer setup in our SQL.
      // If table doesn't exist yet, fallback to user_metadata gracefully to not crash demo
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (data && !error) {
          setRole(data.role);
        } else {
          setRole(user.user_metadata?.role || 'fleet_owner');
        }
      } catch (err) {
        setRole(user.user_metadata?.role || 'fleet_owner');
      } finally {
        setRoleLoading(false);
      }
    };

    if (!loading) {
      fetchRole();
    }
  }, [user, loading]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-cyan" />
      </div>
    );
  }

  // Not logged in -> send to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check roles
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Determine fallback
    if (role === 'admin') return <Navigate to="/admin" replace />;
    if (role === 'city_operator') return <Navigate to="/dashboard" replace />;
    return <Navigate to="/fleet-dashboard" replace />;
  }

  // If passed all checks, render
  return <>{children}</>;
};
