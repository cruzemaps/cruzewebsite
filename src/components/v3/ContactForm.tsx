import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Visible focus ring for keyboard users (inline styles can't express :focus-visible).
const FOCUS_CSS = `.v3-field{outline:none}.v3-field:focus-visible{outline:2px solid #E8590C;outline-offset:1px;border-color:#E8590C}`;

/**
 * "Talk to the team" message form. Tries to store the message in Supabase
 * (table `contact_messages`); if that table is not set up or the client is on
 * placeholder creds, it falls back to opening the visitor's mail client with
 * the message prefilled, so the form is never a dead end.
 */

const accent = "#E8590C";
const text = "#F2F3F5";
const muted = "#9AA0A8";
const line = "rgba(255,255,255,0.12)";
const field = "rgba(255,255,255,0.04)";

// Inbox for contact-form submissions and the mailto fallback.
const CONTACT_EMAIL = "info@cruzemaps.com";

const body = "'Inter Tight', ui-sans-serif, system-ui, sans-serif";
const display = "'Space Grotesk', ui-sans-serif, system-ui, sans-serif";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", org: "", message: "" });
  const [state, setState] = useState<"idle" | "sending" | "done" | "mailto">("idle");

  useEffect(() => {
    if (document.getElementById("v3-field-css")) return;
    const s = document.createElement("style");
    s.id = "v3-field-css";
    s.textContent = FOCUS_CSS;
    document.head.appendChild(s);
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const mailtoHref = () => {
    const subject = encodeURIComponent(`Cruze inquiry from ${form.name || "the website"}`);
    const lines = [`Name: ${form.name}`, `Email: ${form.email}`, form.org && `Organization: ${form.org}`, "", form.message].filter(Boolean).join("\n");
    return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${encodeURIComponent(lines)}`;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setState("sending");
    try {
      const { error } = await supabase.from("contact_messages").insert({
        name: form.name,
        email: form.email,
        organization: form.org || null,
        message: form.message,
      });
      if (error) throw error;
      setState("done");
    } catch {
      // Supabase not wired for this table yet — hand off to the mail client.
      setState("mailto");
      window.location.href = mailtoHref();
    }
  };

  if (state === "done") {
    return (
      <div className="rounded-2xl border p-8 text-center" style={{ borderColor: line, background: field }}>
        <div className="text-2xl mb-2" style={{ fontFamily: display, color: text }}>Thanks. We got it.</div>
        <p style={{ color: muted, fontFamily: body }}>We read every message and usually reply within a day or two.</p>
      </div>
    );
  }

  const input = {
    width: "100%",
    background: field,
    border: `1px solid ${line}`,
    borderRadius: 12,
    padding: "12px 14px",
    color: text,
    fontFamily: body,
    fontSize: 15,
  } as React.CSSProperties;

  return (
    <form onSubmit={submit} className="rounded-2xl border p-6 md:p-8 text-left" style={{ borderColor: line, background: field, fontFamily: body }}>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs mb-1.5" style={{ color: muted }}>Name</label>
          <input required value={form.name} onChange={set("name")} className="v3-field" style={input} placeholder="Your name" />
        </div>
        <div>
          <label className="block text-xs mb-1.5" style={{ color: muted }}>Email</label>
          <input required type="email" value={form.email} onChange={set("email")} className="v3-field" style={input} placeholder="you@company.com" />
        </div>
      </div>
      <div className="mt-4">
        <label className="block text-xs mb-1.5" style={{ color: muted }}>Company or agency <span style={{ opacity: 0.6 }}>(optional)</span></label>
        <input value={form.org} onChange={set("org")} className="v3-field" style={input} placeholder="Fleet, DOT, fund, etc." />
      </div>
      <div className="mt-4">
        <label className="block text-xs mb-1.5" style={{ color: muted }}>Message</label>
        <textarea required value={form.message} onChange={set("message")} rows={4} className="v3-field" style={{ ...input, resize: "vertical" }} placeholder="What are you working on, and how can we help?" />
      </div>
      <button
        type="submit"
        disabled={state === "sending"}
        className="mt-5 w-full sm:w-auto px-7 py-3 rounded-full font-medium text-[15px] transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ background: accent, color: "#fff" }}
      >
        {state === "sending" ? "Sending..." : "Send message"}
      </button>
      <p className="mt-3 text-xs" style={{ color: muted }}>
        Prefer email? <a href={mailtoHref()} className="underline" style={{ color: text }}>Write to us directly.</a>
      </p>
    </form>
  );
}
