/** Pilot application lifecycle + shared field shapes for /apply and dashboards. */

export const PILOT_LIFECYCLE = [
  "pending",
  "in_review",
  "approved",
  "onboarding",
  "active",
  "denied",
  "archived",
] as const;

export type PilotLifecycleStatus = (typeof PILOT_LIFECYCLE)[number];

/** Terminal statuses — user may submit a new application after these. */
export const TERMINAL_PILOT_STATUSES: PilotLifecycleStatus[] = ["denied", "archived"];

export type PilotApplicationRow = {
  id: string;
  user_id: string;
  company_name: string | null;
  truck_size: string | null;
  fleet_size: string | null;
  status: PilotLifecycleStatus;
  website: string | null;
  primary_lanes: string | null;
  fms_provider: string | null;
  fms_other: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_title: string | null;
  application_notes: string | null;
  fleet_visible_message: string | null;
  notes: string | null;
  created_at: string;
  reviewed_at: string | null;
};

export type ApplyWizardPayload = {
  companyName: string;
  website: string;
  fleetSize: string;
  truckSize: string;
  primaryLanes: string;
  fmsProvider: string;
  fmsOther: string;
  contactEmail: string;
  contactName: string;
  contactPhone: string;
  contactTitle: string;
  notes: string;
};

export function pilotInsertFromWizard(
  userId: string,
  data: ApplyWizardPayload
): Record<string, unknown> {
  return {
    user_id: userId,
    company_name: data.companyName,
    truck_size: data.truckSize,
    fleet_size: data.fleetSize,
    website: data.website || null,
    primary_lanes: data.primaryLanes || null,
    fms_provider: data.fmsProvider || null,
    fms_other: data.fmsProvider === "Other" ? data.fmsOther || null : null,
    contact_name: data.contactName,
    contact_email: data.contactEmail,
    contact_phone: data.contactPhone || null,
    contact_title: data.contactTitle || null,
    application_notes: data.notes || null,
    status: "pending",
  };
}

export const PILOT_STATUS_LABELS: Record<PilotLifecycleStatus, string> = {
  pending: "received and queued for review",
  in_review: "under review",
  approved: "approved",
  onboarding: "in onboarding",
  active: "live and active",
  denied: "not selected for the current cohort",
  archived: "archived",
};
