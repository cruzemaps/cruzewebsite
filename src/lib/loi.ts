// Letter of Intent: source of truth for the document text + a renderer that
// fills in the participant's details. Imported by both the signing UI in
// /apply and the printable view at /loi/:id.
//
// IMPORTANT: when the LOI text changes substantively, bump LOI_VERSION.
// Old signatures preserve their original text via loi_signatures.loi_full_text,
// so legacy records remain accurate.

export const LOI_VERSION = "1.0";
export const PERFORMANCE_FEE_MIN_PCT = 15;
export const PERFORMANCE_FEE_MAX_PCT = 45;

export type LOIFields = {
  participantName: string;
  participantCompany: string;
  participantTitle?: string;
  fleetSize: string;
  signedDate: string; // ISO or formatted
  initials: string;
};

// Renders the full LOI body text with placeholders filled in. This is the
// exact text the user agrees to and that gets snapshotted into the DB.
export function renderLOIText(fields: LOIFields): string {
  return `LETTER OF INTENT: 30-DAY PILOT PROGRAM

BETWEEN: Cruzemaps (The Provider)
AND: ${fields.participantCompany} (The Participant)

1. PURPOSE & OBJECTIVE
This Letter of Intent (LOI) outlines the terms under which The Participant will evaluate Cruze software. The pilot aims to validate the performance of the Physics-Informed Neural Network (PINN) and Signal Phase and Timing (SPaT) software of Cruze in optimizing Green Velocity to reduce fuel consumption and brake wear.

2. SCOPE OF EVALUATION
Term: 30 days commencing on the date of technical activation (Pilot Period).
Fleet Integration: ${fields.fleetSize} vehicles shall be enrolled.
Deployment: Software-only implementation. No hardware installation is required; the interface is accessible via standard mobile devices/tablets.
Hardware Responsibility: The Participant is fully responsible for provisioning the physical devices, cellular data plans, and secure dashboard mounts necessary for drivers to safely access the system.

3. PERFORMANCE MODEL & SAVINGS VERIFICATION
Cost Structure: The Pilot Program is provided with zero upfront licensing fees.
The Cruze Model: The application predicts real-time fuel savings based on driver adherence to velocity prompts.
Baseline Approval Contingency: Prior to the start of the Pilot Period, the exact 90-day historical baseline metrics for fuel and maintenance must be formally reviewed and mutually approved in writing.
Verification: Savings are calculated by comparing the Pilot Period data against the mutually approved historical baseline.
Performance Fee: Upon completion, if documented savings are achieved, Cruze shall be entitled to a performance fee of ${PERFORMANCE_FEE_MIN_PCT}–${PERFORMANCE_FEE_MAX_PCT}% of the total savings generated during the Term.

4. DATA & SAFETY
Data Access: The Participant agrees to provide Cruze with access to relevant telematics or fuel card data (e.g., MPG, braking events) solely for the purpose of verifying savings.
Data Security and Training: Fleet routing and fuel data will be anonymized. The Participant grants Cruze the right to utilize the anonymized pilot data to train and enhance the broader neural network models.
Safety First: The Participant acknowledges that the Green Velocity prompts are advisory. Drivers must prioritize road conditions, traffic laws, and safe operation over software prompts at all times. Cruze assumes no liability for traffic violations or incidents occurring during the pilot.

5. INTELLECTUAL PROPERTY & CONFIDENTIALITY
IP Ownership: Cruze retains all rights, titles, and interests in the PINN and SPaT software. No license is granted other than the right to use the software during the Pilot Period.
Confidentiality: Both parties agree to protect proprietary information, including software mechanics and fleet performance data.

6. TERMINATION & NEXT STEPS
This LOI is entirely non-binding and may be terminated by either party with 7 days written notice. Upon successful completion of the pilot, both parties intend to negotiate in good faith a Master Service Agreement (MSA) for long-term fleet-wide deployment.

7. GOVERNING LAW
Any matters arising from this evaluation shall be governed by the laws of the State of Texas.

AUTHORIZED SIGNATURES

For The Participant: ${fields.participantName}
${fields.participantTitle ? `Title: ${fields.participantTitle}\n` : ""}Initials: ${fields.initials}
Signed (electronic): ${fields.signedDate}

For Cruze: Anudeep Bonagiri
Title: Founder
Cruze Technologies, Austin, Texas`;
}

// Plain-English summary shown above the full text in the signing UI, so
// drivers see the gist before deciding to read the legal text.
export const LOI_SUMMARY_BULLETS = [
  "30-day pilot of Cruze software, no hardware to install.",
  "Zero upfront cost. Performance fee of " +
    PERFORMANCE_FEE_MIN_PCT +
    "–" +
    PERFORMANCE_FEE_MAX_PCT +
    "% only on documented savings.",
  "Cruze gets read-only access to telematics for verifying savings. Data is anonymized.",
  "Non-binding. Either side can walk with 7 days written notice.",
  "Drivers always have safety priority over software prompts.",
];

// Produce default initials from a participant name. "Sam Patel" → "SP".
// Simple, opinionated; user can override.
export function suggestInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 4);
}
