import { Link } from "react-router-dom";
import { legalTokens as t } from "./legalTokens";

/**
 * Shared presentational building blocks for the static legal pages, so each
 * page body reads as plain prose and stays visually identical to the existing
 * Terms / Privacy / Support pages. Component-only exports (plus one string
 * constant, which the lint config allows) keep React Fast Refresh happy.
 */

// The date every legal page shows as "Last updated". Bump when the documents
// change materially.
export const LEGAL_LAST_UPDATED = "2026-10-22";

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs uppercase tracking-[0.18em] mb-5" style={{ color: t.accent, fontFamily: t.body }}>
      {children}
    </p>
  );
}

export function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="font-bold tracking-[-0.025em] leading-[1.05]"
      style={{ fontFamily: t.display, color: t.text, fontSize: "clamp(2.2rem, 5vw, 3.4rem)" }}
    >
      {children}
    </h1>
  );
}

export function Updated({ date }: { date: string }) {
  return (
    <p className="mt-5 text-[15px]" style={{ color: t.muted }}>
      Last updated: {date}
    </p>
  );
}

export function H2({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="font-bold tracking-[-0.02em] mt-12 mb-4 scroll-mt-24"
      style={{ fontFamily: t.display, color: t.text, fontSize: "clamp(1.4rem, 2.6vw, 1.9rem)" }}
    >
      {children}
    </h2>
  );
}

export function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-semibold mt-7 mb-2.5" style={{ fontFamily: t.display, color: t.text, fontSize: "1.1rem" }}>
      {children}
    </h3>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 text-[15px] md:text-base leading-relaxed" style={{ color: t.muted }}>
      {children}
    </p>
  );
}

export function UL({ children }: { children: React.ReactNode }) {
  return <ul className="mt-4 space-y-2.5 text-[15px] md:text-base leading-relaxed list-none">{children}</ul>;
}

export function LI({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3" style={{ color: t.muted }}>
      <span className="mt-2.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: t.accent }} />
      <span>{children}</span>
    </li>
  );
}

export function Mail({ addr }: { addr: string }) {
  return (
    <a href={`mailto:${addr}`} className="underline transition-colors hover:text-white" style={{ color: t.text }}>
      {addr}
    </a>
  );
}

// A clearly-marked gap for Anudeep's counsel to fill before these documents are
// relied on. Rendered as highlighted [PLACEHOLDER: ...] text so it is obvious on
// the page and in the PR preview. Every one is collected in the PR description.
export function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <mark
      className="rounded px-1.5 py-0.5 text-[0.9em] font-semibold"
      style={{ background: "rgba(232,89,12,0.16)", color: t.accent }}
    >
      [PLACEHOLDER: {children}]
    </mark>
  );
}

// Who-we-are + contact block, shared by the legal pages for a consistent
// identity footer.
export function CompanyBlock() {
  return (
    <div className="mt-14 pt-8 border-t" style={{ borderColor: t.line }}>
      <H3>Who we are and how to reach us</H3>
      <P>
        Cruze is operated by Cruze Maps, Inc., a Delaware corporation with its principal place of
        business in San Antonio, Texas ("Cruze", "Cruzemaps", "we", "us").
      </P>
      <P>Mailing address: 18203 Rim Drive 101 #1043, San Antonio, TX 78257, United States.</P>
      <P>
        Contact for legal, privacy, data protection, and security matters: <Mail addr="info@cruzemaps.com" />.
        Product support: <Mail addr="support@cruzemaps.com" />.
      </P>
    </div>
  );
}

// Footer row of links to the other legal pages.
export function RelatedLinks({ links }: { links: [string, string][] }) {
  return (
    <div className="mt-12 pt-8 border-t flex flex-wrap gap-x-6 gap-y-2 text-[15px]" style={{ borderColor: t.line }}>
      {links.map(([label, to]) => (
        <Link key={to} to={to} className="font-medium hover:text-white transition-colors" style={{ color: t.accent }}>
          {label}
        </Link>
      ))}
    </div>
  );
}
