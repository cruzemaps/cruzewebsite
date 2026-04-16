import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import V2 from "./pages/V2";
import UIInterns from "./pages/UIInterns";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import RoutePlanner from "./pages/RoutePlanner";
import MissionControl from "./pages/MissionControl";
import FleetDashboard from "./pages/FleetDashboard";
import AdminPortal from "./pages/AdminPortal";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<V2 />} />
            <Route path="/login" element={<Login />} />
            <Route path="/route-planner" element={<RoutePlanner />} />
            
            {/* Protected Routes by Role */}
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['city_operator']}><MissionControl /></ProtectedRoute>} />
            <Route path="/fleet-dashboard" element={<ProtectedRoute allowedRoles={['fleet_owner']}><FleetDashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminPortal /></ProtectedRoute>} />
            
            <Route path="/uiinterns" element={<UIInterns />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
