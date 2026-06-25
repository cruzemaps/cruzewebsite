import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpDown,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Leaf,
  Gauge,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  useFleetScores,
  CRUZE_API_URL,
  type FleetDriver,
  type ScoreBand,
} from "@/hooks/useFleetScores";

// Fleet Driver Scores dashboard (Phase 2b). Reads live scores from the
// CruzePlatform backend and shows a fleet manager a sortable safety/efficiency
// leaderboard, worst-overall first (most actionable). On-brand with the V3 dark
// site: charcoal background, Space Grotesk display font, orange accent.

type SortKey = "overall" | "safety" | "efficiency" | "miles" | "gallons";
type SortDir = "asc" | "desc";

const WINDOW_OPTIONS = [7, 14, 30, 90];

// Band -> colour treatment. Excellent/Good green, Fair/Needs Improvement amber,
// At Risk red. Kept as Tailwind class strings so there are no inline styles.
const BAND_STYLES: Record<ScoreBand, string> = {
  Excellent: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Good: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Fair: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  "Needs Improvement": "bg-amber-500/15 text-amber-300 border-amber-500/30",
  "At Risk": "bg-red-500/15 text-red-300 border-red-500/30",
};

function BandPill({ band }: { band: ScoreBand | null }) {
  if (!band) {
    return (
      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-white/50">
        No data
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        BAND_STYLES[band]
      )}
    >
      {band}
    </span>
  );
}

function fmtScore(value: number | null | undefined): string {
  if (value === null || value === undefined) return "--";
  return Math.round(value).toString();
}

function fmtNum(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined) return "--";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

// Score colour: low scores read hot (need attention), high scores cool/green.
function scoreColor(value: number | null | undefined): string {
  if (value === null || value === undefined) return "text-white/40";
  if (value >= 80) return "text-emerald-300";
  if (value >= 60) return "text-amber-300";
  return "text-red-300";
}

function SummaryStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center gap-2 text-white/50">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-2 font-display text-3xl font-semibold text-white">{value}</div>
    </div>
  );
}

const Shell = ({ children }: { children: React.ReactNode }) => {
  const { user, signOut } = useAuth();
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0B0D11] font-body text-white">
      <div className="pointer-events-none absolute right-[-10%] top-[-10%] h-[600px] w-[600px] rounded-full bg-brand-orange/10 blur-[150px]" />
      <nav className="relative z-50 flex w-full items-center justify-between border-b border-white/5 bg-[#0B0D11]/50 p-6 backdrop-blur-md">
        <Link
          to="/"
          className="group inline-flex items-center gap-2 text-white/70 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
          <span className="font-medium tracking-wide">Back to Home</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            to="/fleet-dashboard"
            className="hidden text-sm text-white/60 transition-colors hover:text-white sm:block"
          >
            Pilot status
          </Link>
          <span className="hidden text-sm text-white/40 sm:block">{user?.email}</span>
          <Button
            variant="ghost"
            onClick={() => signOut()}
            className="text-white hover:bg-transparent hover:text-brand-orange"
          >
            Sign Out
          </Button>
        </div>
      </nav>
      <main className="relative z-10 mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
};

// Panel shown until the manager connects to the backend (no token yet). Supports
// either a username/password login OR pasting a backend session token directly.
// This is the fallback path: it only appears when the transparent Supabase-to-backend
// SSO exchange is unavailable.
function ConnectPanel({
  onLogin,
  onToken,
  error,
  signedIn,
}: {
  onLogin: (u: string, p: string) => void;
  onToken: (t: string) => void;
  error: string | null;
  signedIn: boolean;
}) {
  const [mode, setMode] = useState<"login" | "token">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setTokenInput] = useState("");

  return (
    <div className="mx-auto mt-6 max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8">
      <h1 className="font-display text-2xl font-semibold text-white">Connect the fleet backend</h1>
      <p className="mt-2 text-sm leading-relaxed text-white/60">
        {signedIn
          ? "Single sign-on to the fleet backend is not available right now. Sign in with your manager credentials, or paste a backend session token to continue."
          : "Driver scores come from the Cruze fleet API. Sign in with your manager credentials, or paste a backend session token."}
      </p>
      <p className="mt-2 text-xs text-white/40">
        Backend: <span className="font-mono">{CRUZE_API_URL}</span>
      </p>

      <div className="mt-5 flex gap-2 rounded-xl border border-white/10 bg-black/20 p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={cn(
            "flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            mode === "login" ? "bg-brand-orange text-white" : "text-white/60 hover:text-white"
          )}
        >
          Manager login
        </button>
        <button
          type="button"
          onClick={() => setMode("token")}
          className={cn(
            "flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            mode === "token" ? "bg-brand-orange text-white" : "text-white/60 hover:text-white"
          )}
        >
          Paste token
        </button>
      </div>

      {mode === "login" ? (
        <form
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onLogin(username, password);
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="fs-username" className="text-white/70">
              Username
            </Label>
            <Input
              id="fs-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="border-white/10 bg-black/30 text-white placeholder:text-white/30"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fs-password" className="text-white/70">
              Password
            </Label>
            <Input
              id="fs-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="border-white/10 bg-black/30 text-white placeholder:text-white/30"
            />
          </div>
          <Button type="submit" className="w-full bg-brand-orange text-white hover:bg-brand-orange/90">
            Connect
          </Button>
        </form>
      ) : (
        <form
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onToken(token);
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="fs-token" className="text-white/70">
              Bearer token
            </Label>
            <Input
              id="fs-token"
              value={token}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="eyJ..."
              className="border-white/10 bg-black/30 font-mono text-white placeholder:text-white/30"
            />
          </div>
          <Button type="submit" className="w-full bg-brand-orange text-white hover:bg-brand-orange/90">
            Use token
          </Button>
        </form>
      )}

      {error && (
        <p className="mt-4 flex items-start gap-2 text-sm text-red-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      <p className="mt-6 border-t border-white/5 pt-4 text-xs leading-relaxed text-white/40">
        Normally your Cruze sign-in connects to the fleet backend automatically.
        This manual step appears only when that single sign-on is unavailable.
      </p>
    </div>
  );
}

const FleetScores = () => {
  // Bridge the website's Supabase session to a backend token via the SSO exchange.
  // The hook uses this access token to mint a backend session transparently; if the
  // exchange is unavailable it falls back to the manual ConnectPanel below.
  const { session } = useAuth();
  const supabaseAccessToken =
    (session?.access_token as string | undefined) ?? null;

  const {
    status,
    data,
    error,
    windowDays,
    setWindowDays,
    login,
    setToken,
    logout,
    refresh,
  } = useFleetScores(7, { supabaseAccessToken });

  // Default sort: worst overall first (ascending), the most actionable view.
  const [sortKey, setSortKey] = useState<SortKey>("overall");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const sortedDrivers = useMemo<FleetDriver[]>(() => {
    const drivers = data?.drivers ? [...data.drivers] : [];
    const valueOf = (d: FleetDriver): number => {
      switch (sortKey) {
        case "overall":
          return d.scores?.overall ?? Number.POSITIVE_INFINITY;
        case "safety":
          return d.scores?.safety ?? Number.POSITIVE_INFINITY;
        case "efficiency":
          return d.scores?.efficiency ?? Number.POSITIVE_INFINITY;
        case "miles":
          return d.miles_driven ?? 0;
        case "gallons":
          return d.modeled_gallons_wasted ?? 0;
        default:
          return 0;
      }
    };
    drivers.sort((a, b) => {
      const av = valueOf(a);
      const bv = valueOf(b);
      // Drivers without data always sort to the bottom regardless of direction.
      const aHas = a.scores?.has_data ?? false;
      const bHas = b.scores?.has_data ?? false;
      if (aHas !== bHas) return aHas ? -1 : 1;
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return drivers;
  }, [data, sortKey, sortDir]);

  const summary = data?.fleet_summary ?? {};
  const driverCount = summary.driver_count ?? data?.drivers?.length ?? 0;

  // Worst performers: lowest overall among drivers that have data.
  const worst = useMemo(() => {
    return (data?.drivers ?? [])
      .filter((d) => d.scores?.has_data && d.scores.overall !== null)
      .sort((a, b) => (a.scores.overall ?? 0) - (b.scores.overall ?? 0))
      .slice(0, 3);
  }, [data]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      // Scores default ascending (worst first); volume metrics default descending.
      setSortDir(key === "miles" || key === "gallons" ? "desc" : "asc");
    }
  };

  const SortHeader = ({
    label,
    sortKeyName,
    className,
  }: {
    label: string;
    sortKeyName: SortKey;
    className?: string;
  }) => (
    <th className={cn("px-4 py-3 text-xs font-medium uppercase tracking-wider text-white/50", className)}>
      <button
        type="button"
        onClick={() => toggleSort(sortKeyName)}
        className={cn(
          "inline-flex items-center gap-1 transition-colors hover:text-white",
          sortKey === sortKeyName && "text-brand-orange"
        )}
      >
        {label}
        <ArrowUpDown className="h-3 w-3" />
      </button>
    </th>
  );

  if (status === "exchanging") {
    return (
      <Shell>
        <div className="mx-auto mt-6 flex max-w-md flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
          <p className="font-display text-lg font-semibold text-white">
            Signed in
          </p>
          <p className="text-sm leading-relaxed text-white/60">
            Connecting to the fleet backend...
          </p>
        </div>
      </Shell>
    );
  }

  if (status === "needs_auth") {
    return (
      <Shell>
        <ConnectPanel
          onLogin={login}
          onToken={setToken}
          error={error}
          signedIn={Boolean(supabaseAccessToken)}
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-sm font-medium uppercase tracking-[0.2em] text-brand-orange">
            Fleet safety and efficiency
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-white sm:text-4xl">
            Driver Scores
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/50">
            Live scores from the Cruze fleet backend over the selected window.
            Drivers are listed worst overall first so you can act on the ones that
            need attention.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/20 p-1">
            {WINDOW_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setWindowDays(d)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  windowDays === d
                    ? "bg-brand-orange text-white"
                    : "text-white/60 hover:text-white"
                )}
              >
                {d}d
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={refresh}
            aria-label="Refresh"
            className="text-white/60 hover:bg-white/5 hover:text-white"
          >
            <RefreshCw className={cn("h-4 w-4", status === "loading" && "animate-spin")} />
          </Button>
        </div>
      </div>

      {status === "loading" && (
        <div className="mt-16 flex flex-col items-center justify-center gap-3 text-white/50">
          <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
          <p>Loading fleet scores...</p>
        </div>
      )}

      {status === "error" && (
        <div className="mt-10 rounded-2xl border border-red-500/30 bg-red-500/[0.06] p-6">
          <p className="flex items-center gap-2 font-display text-lg font-semibold text-red-200">
            <AlertTriangle className="h-5 w-5" />
            Could not load fleet scores
          </p>
          <p className="mt-2 text-sm text-white/60">{error}</p>
          <div className="mt-4 flex gap-3">
            <Button onClick={refresh} className="bg-brand-orange text-white hover:bg-brand-orange/90">
              Retry
            </Button>
            <Button variant="ghost" onClick={logout} className="text-white/70 hover:text-white">
              Reconnect backend
            </Button>
          </div>
        </div>
      )}

      {status === "empty" && (
        <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
          <p className="font-display text-lg font-semibold text-white">No drivers yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/50">
            The backend returned no drivers for this window. Once drivers log miles
            on the Cruze app, their scores will appear here.
          </p>
          <Button
            variant="ghost"
            onClick={() => setWindowDays(90)}
            className="mt-4 text-brand-orange hover:bg-white/5"
          >
            Try a 90-day window
          </Button>
        </div>
      )}

      {status === "ready" && data && (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <SummaryStat
              label="Drivers"
              value={fmtNum(driverCount)}
              icon={<Gauge className="h-4 w-4" />}
            />
            <SummaryStat
              label="Avg overall"
              value={fmtScore(summary.avg_overall)}
              icon={<ArrowUpDown className="h-4 w-4" />}
            />
            <SummaryStat
              label="Avg safety"
              value={fmtScore(summary.avg_safety)}
              icon={<ShieldCheck className="h-4 w-4" />}
            />
            <SummaryStat
              label="Avg efficiency"
              value={fmtScore(summary.avg_efficiency)}
              icon={<Leaf className="h-4 w-4" />}
            />
          </div>

          {worst.length > 0 && (
            <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5">
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-amber-300/80">
                <AlertTriangle className="h-4 w-4" />
                Needs attention
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {worst.map((d) => (
                  <span
                    key={d.driver_id}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-sm"
                  >
                    <span className="font-mono text-white/80">{d.driver_id}</span>
                    <span className={cn("font-semibold", scoreColor(d.scores.overall))}>
                      {fmtScore(d.scores.overall)}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead className="border-b border-white/10 bg-white/[0.03]">
                  <tr>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-white/50">
                      Driver
                    </th>
                    <SortHeader label="Overall" sortKeyName="overall" />
                    <SortHeader label="Safety" sortKeyName="safety" />
                    <SortHeader label="Efficiency" sortKeyName="efficiency" />
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-white/50">
                      Band
                    </th>
                    <SortHeader label="Miles" sortKeyName="miles" className="text-right" />
                    <SortHeader label="Gal. wasted" sortKeyName="gallons" className="text-right" />
                  </tr>
                </thead>
                <tbody>
                  {sortedDrivers.map((d) => (
                    <tr
                      key={d.driver_id}
                      className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03]"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-white/80">{d.driver_id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("font-display text-lg font-semibold", scoreColor(d.scores?.overall))}>
                          {fmtScore(d.scores?.overall)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("font-medium", scoreColor(d.scores?.safety))}>
                          {fmtScore(d.scores?.safety)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("font-medium", scoreColor(d.scores?.efficiency))}>
                          {fmtScore(d.scores?.efficiency)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <BandPill band={d.scores?.band ?? null} />
                      </td>
                      <td className="px-4 py-3 text-right text-white/70">
                        {fmtNum(d.miles_driven, 0)}
                      </td>
                      <td className="px-4 py-3 text-right text-white/70">
                        {fmtNum(d.modeled_gallons_wasted, 1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {data.phase_0_notes && data.phase_0_notes.length > 0 && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">
                Backend notes
              </p>
              <ul className="mt-2 space-y-1 text-sm text-white/50">
                {data.phase_0_notes.map((note, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-brand-orange">-</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between text-xs text-white/30">
            <span>
              Window: last {data.window?.days ?? windowDays} days. Source: {CRUZE_API_URL}
            </span>
            <button type="button" onClick={logout} className="hover:text-white/60">
              Disconnect backend
            </button>
          </div>
        </>
      )}
    </Shell>
  );
};

export default FleetScores;
