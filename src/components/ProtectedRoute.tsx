import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth, type AppRole } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, role, status, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-cyan" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Suspended/archived accounts can authenticate but cannot access dashboards.
  if (status === "suspended" || status === "archived") {
    return <Navigate to="/login?reason=account_suspended" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    if (role === "admin") return <Navigate to="/admin" replace />;
    if (role === "city_operator") return <Navigate to="/dashboard" replace />;
    return <Navigate to="/fleet-dashboard" replace />;
  }

  return (
    <>
      <ImpersonationBanner />
      {children}
    </>
  );
};
