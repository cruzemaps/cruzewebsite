import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, type AppRole } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, role, status, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-cyan" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  // Suspended/archived users can authenticate but cannot reach dashboards.
  if (status === "suspended" || status === "archived") {
    return <Navigate to="/login?reason=account_suspended" replace />;
  }

  // Default-deny: a null role means the JWT custom-claims hook isn't installed
  // or the user has never been assigned a role. Either way, do NOT trust
  // user_metadata fallback — that field is user-controllable at signup.
  if (allowedRoles && allowedRoles.length > 0) {
    if (!role) {
      return <Navigate to="/login?reason=role_unassigned" replace />;
    }
    if (!allowedRoles.includes(role)) {
      // Send them to the dashboard their actual role is permitted to see.
      if (role === "admin") return <Navigate to="/admin" replace />;
      if (role === "city_operator") return <Navigate to="/dashboard" replace />;
      return <Navigate to="/fleet-dashboard" replace />;
    }
  }

  return (
    <>
      <ImpersonationBanner />
      {children}
    </>
  );
};
