import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { clearDemoSession, getImpersonatedUserId } from "@/lib/demoMode";

// Mounted at the top of every protected dashboard. If this tab is in an admin
// "view as user" preview (DEV builds only, see demoMode.ts), show a sticky
// banner so admins don't forget they're not in their own account, and so they
// have a one-click exit.
export function ImpersonationBanner() {
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    setTarget(getImpersonatedUserId());
  }, []);

  if (!target) return null;

  const exit = () => {
    clearDemoSession();
    window.location.href = "/admin";
  };

  return (
    <div className="sticky top-0 z-[60] bg-red-500/95 text-white px-4 py-2 flex items-center justify-center gap-3 text-sm">
      <AlertTriangle size={16} />
      <span>
        Impersonating user <code className="font-mono px-1.5 py-0.5 rounded bg-black/20">{target.slice(0, 12)}…</code>. All actions are logged.
      </span>
      <button onClick={exit} className="ml-2 underline font-semibold">Exit impersonation</button>
    </div>
  );
}
