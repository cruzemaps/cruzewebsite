import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AnalyticsListener } from "./components/AnalyticsListener";
import V3 from "./pages/V3";
import { Loader2 } from "lucide-react";

// V3 is the homepage and stays eager so first paint has zero waterfall. The old
// V2 design is kept lazy at /v2 as a fast rollback lever.
const V2 = lazy(() => import("./pages/V2"));

// Lazy-load every non-homepage route. The homepage stays eager so first paint
// has zero waterfall. Everything else is split into its own chunk.
const Investors = lazy(() => import("./pages/Investors"));
const ForFleets = lazy(() => import("./pages/ForFleets"));
const ForCities = lazy(() => import("./pages/ForCities"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Press = lazy(() => import("./pages/Press"));
const Stats = lazy(() => import("./pages/Stats"));
const Insights = lazy(() => import("./pages/Insights"));
const InsightDetail = lazy(() => import("./pages/InsightDetail"));
const Cities = lazy(() => import("./pages/Cities"));
const CityDetail = lazy(() => import("./pages/CityDetail"));
const Lanes = lazy(() => import("./pages/Lanes"));
const LaneDetail = lazy(() => import("./pages/LaneDetail"));
const Apply = lazy(() => import("./pages/Apply"));
const Cameras = lazy(() => import("./pages/Cameras"));
const Lab = lazy(() => import("./pages/Lab"));
const ImpersonateHandoff = lazy(() => import("./pages/ImpersonateHandoff"));
const DemoHandoff = lazy(() => import("./pages/DemoHandoff"));
const Diag = lazy(() => import("./pages/Diag"));
const LOIView = lazy(() => import("./pages/LOIView"));
const UIInterns = lazy(() => import("./pages/UIInterns"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(() => import("./pages/Login"));
const InviteAccept = lazy(() => import("./pages/InviteAccept"));
const RoutePlanner = lazy(() => import("./pages/RoutePlanner"));
const MissionControl = lazy(() => import("./pages/MissionControl"));
const FleetDashboard = lazy(() => import("./pages/FleetDashboard"));
const AdminPortal = lazy(() => import("./pages/AdminPortal"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-brand-cyan" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnalyticsListener />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              {/* Public marketing */}
              <Route path="/" element={<V3 />} />
              {/* Old design kept reachable for rollback/QA */}
              <Route path="/v2" element={<V2 />} />
              {/* Old preview URL now redirects to the promoted homepage */}
              <Route path="/v3" element={<Navigate to="/" replace />} />
              <Route path="/for-fleets" element={<ForFleets />} />
              <Route path="/for-cities" element={<ForCities />} />
              <Route path="/investors" element={<Investors />} />
              {/* Collapse the duplicate: /investor 301-equivalent client redirect */}
              <Route path="/investor" element={<Navigate to="/investors" replace />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/press" element={<Press />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/insights/:slug" element={<InsightDetail />} />
              <Route path="/cities" element={<Cities />} />
              <Route path="/cities/:slug" element={<CityDetail />} />
              <Route path="/lanes" element={<Lanes />} />
              <Route path="/lanes/:slug" element={<LaneDetail />} />
              <Route path="/apply" element={<Apply />} />
              <Route path="/cameras" element={<Cameras />} />
              {/* Hidden internal CV test page — not linked, noindex'd in SEO */}
              <Route path="/lab" element={<Lab />} />
              <Route path="/route-planner" element={<RoutePlanner />} />

              {/* Auth */}
              <Route path="/login" element={<Login />} />
              <Route path="/invite/:token" element={<InviteAccept />} />
              <Route path="/impersonate" element={<ImpersonateHandoff />} />
              <Route path="/demo" element={<DemoHandoff />} />
              <Route path="/diag" element={<Diag />} />
              <Route path="/loi/:id" element={<LOIView />} />

              {/* Protected dashboards */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={["city_operator"]}>
                    <MissionControl />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fleet-dashboard"
                element={
                  <ProtectedRoute allowedRoles={["fleet_owner"]}>
                    <FleetDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminPortal />
                  </ProtectedRoute>
                }
              />

              <Route path="/uiinterns" element={<UIInterns />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
