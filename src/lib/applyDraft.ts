import { supabase } from "@/lib/supabase";
import type { ApplyWizardPayload } from "@/lib/pilotApplication";

const SESSION_KEY = "pending_application";

export type WizardDraft = ApplyWizardPayload & {
  loiAgreed?: boolean;
  loiInitials?: string;
};

export function loadSessionDraft(): WizardDraft | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WizardDraft;
  } catch {
    return null;
  }
}

export function saveSessionDraft(data: WizardDraft) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

export function clearSessionDraft() {
  sessionStorage.removeItem(SESSION_KEY);
}

/** Merge DB draft, session draft, and defaults. LOI fields are never restored from draft. */
export async function loadWizardDraft(
  userId: string | undefined,
  userEmail: string | undefined
): Promise<WizardDraft> {
  const base: WizardDraft = {
    companyName: "",
    website: "",
    fleetSize: "",
    truckSize: "",
    primaryLanes: "",
    fmsProvider: "",
    fmsOther: "",
    contactEmail: userEmail || "",
    contactName: "",
    contactPhone: "",
    contactTitle: "",
    notes: "",
    loiAgreed: false,
    loiInitials: "",
  };

  let merged = { ...base };

  if (userId) {
    const { data: dbDraft } = await supabase.rpc("get_pilot_draft");
    if (dbDraft && typeof dbDraft === "object" && Object.keys(dbDraft as object).length > 0) {
      merged = { ...merged, ...(dbDraft as WizardDraft) };
    }
  }

  const session = loadSessionDraft();
  if (session) {
    merged = { ...merged, ...session };
  }

  return {
    ...merged,
    loiAgreed: false,
    loiInitials: "",
    contactEmail: userEmail || merged.contactEmail || "",
  };
}

let draftTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleDraftPersist(userId: string | undefined, data: WizardDraft) {
  const { loiAgreed: _a, loiInitials: _b, ...rest } = data;
  saveSessionDraft({ ...rest, loiAgreed: false, loiInitials: "" });

  if (!userId) return;

  if (draftTimer) clearTimeout(draftTimer);
  draftTimer = setTimeout(() => {
    supabase.rpc("upsert_pilot_draft", { p_payload: rest }).then(({ error }) => {
      if (error) console.warn("Draft save failed:", error.message);
    });
  }, 800);
}

export async function clearAllDrafts() {
  clearSessionDraft();
  await supabase.rpc("delete_pilot_draft");
}
