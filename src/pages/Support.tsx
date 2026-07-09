import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import LegalLayout, { legalTokens as t } from "@/components/legal/LegalLayout";

/**
 * Support page for the Cruze driver app. App Store and Google Play both require
 * a working support URL, so this page must be reachable as real HTML and appear
 * in the sitemap (registered in scripts/prerender.mjs). It covers how to get
 * help, the most common topics drivers hit, and links to Privacy and Terms.
 */

const SUPPORT_EMAIL = "support@cruzemaps.com";

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-bold tracking-[-0.02em] mt-12 mb-4" style={{ fontFamily: t.display, color: t.text, fontSize: "clamp(1.4rem, 2.6vw, 1.9rem)" }}>
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 text-[15px] md:text-base leading-relaxed" style={{ color: t.muted }}>{children}</p>;
}

const mail = (addr: string) => (
  <a href={`mailto:${addr}`} className="underline transition-colors hover:text-white" style={{ color: t.text }}>{addr}</a>
);

const TOPICS: { q: string; steps: React.ReactNode }[] = [
  {
    q: "How do I delete my account and data?",
    steps: (
      <>
        You can delete your account and its data from inside the app at any time. Open the app, go to Profile, then tap
        Delete Account and confirm. This removes your personal data, subject to records we are required by law to keep. If
        you cannot reach the app, email {mail(SUPPORT_EMAIL)} from your account address and we will process the deletion
        for you. See the <Link to="/privacy" className="underline" style={{ color: t.text }}>Privacy Policy</Link> for details on retention.
      </>
    ),
  },
  {
    q: "Why does Cruze ask for location, microphone, and motion permissions?",
    steps: (
      <>
        Each permission powers a specific feature. Precise location drives the live map, navigation, and location-based
        safety advisories. The microphone is used to detect crash sounds so the app can flag a collision for safety and
        forensic purposes. Motion and accelerometer sensors detect hard braking and crashes and run on-device tire and
        engine diagnostics. You can manage these in your device settings, but turning one off disables the features that
        depend on it.
      </>
    ),
  },
  {
    q: "The map or my location is not updating",
    steps: (
      <>
        First confirm that location permission is set to Allow While Using or Always in your device settings, and that the
        app has a clear view of GPS. If the live map looks frozen, check that your device has a working data connection,
        then fully close and reopen the app. If the problem continues, send us the time it happened and your device model
        at {mail(SUPPORT_EMAIL)}.
      </>
    ),
  },
  {
    q: "Live data or messages are not coming through (MQTT / connection issues)",
    steps: (
      <>
        Cruze streams live updates over a realtime connection (MQTT). If updates stop, this is almost always a network
        issue. Make sure you are not on a restrictive Wi-Fi network that blocks non-standard ports, try switching between
        Wi-Fi and cellular, and confirm the app has background network access. Reopening the app re-establishes the
        connection. If it still fails, email {mail(SUPPORT_EMAIL)} with your carrier or network and roughly when it
        started, and we will check it on our side.
      </>
    ),
  },
  {
    q: "Crash or safety detection seems wrong",
    steps: (
      <>
        Crash and hard-braking detection use motion sensors and microphone audio together, and they can occasionally flag
        an event that was not a real crash, or miss one. If you see a detection that looks wrong, tell us what happened and
        when at {mail(SUPPORT_EMAIL)} so we can tune the models. Always rely on your own judgment on the road, not on an
        app advisory.
      </>
    ),
  },
];

export default function Support() {
  return (
    <LegalLayout>
      <SEO
        title="Support | Cruze"
        description="Get help with the Cruze driver app: account deletion, permissions, location and connection troubleshooting, and how to reach our team."
      />

      <article className="mx-auto max-w-3xl px-5 sm:px-6 py-16 md:py-24">
        <p className="text-xs uppercase tracking-[0.18em] mb-5" style={{ color: t.accent, fontFamily: t.body }}>Support</p>
        <h1 className="font-bold tracking-[-0.025em] leading-[1.05]" style={{ fontFamily: t.display, color: t.text, fontSize: "clamp(2.2rem, 5vw, 3.4rem)" }}>
          Help with Cruze
        </h1>
        <p className="mt-5 text-[15px] md:text-base leading-relaxed" style={{ color: t.muted }}>
          We answer every message. The fastest way to reach us is email, and we usually reply within a day or two.
        </p>

        {/* Primary contact card */}
        <div className="mt-8 rounded-2xl border p-6 md:p-8" style={{ borderColor: t.line, background: t.bg2 }}>
          <div className="text-xs uppercase tracking-[0.18em] mb-2" style={{ color: t.accent }}>Contact</div>
          <div className="font-semibold text-lg mb-1" style={{ fontFamily: t.display, color: t.text }}>Email our support team</div>
          <p className="text-[15px]" style={{ color: t.muted }}>
            Write to {mail(SUPPORT_EMAIL)}. Include your account email, your device model, and what you were doing when the
            problem happened. That helps us fix it faster.
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mt-5 inline-flex px-6 py-3 rounded-full font-medium text-[15px] transition-opacity hover:opacity-90"
            style={{ background: t.accent, color: "#fff", fontFamily: t.body }}
          >
            Email support
          </a>
        </div>

        <H2>Common topics</H2>
        <div className="mt-2 divide-y" style={{ borderColor: t.line }}>
          {TOPICS.map((topic) => (
            <div key={topic.q} className="py-6 border-t" style={{ borderColor: t.line }}>
              <h3 className="font-semibold mb-2.5" style={{ fontFamily: t.display, color: t.text, fontSize: "1.1rem" }}>{topic.q}</h3>
              <p className="text-[15px] md:text-base leading-relaxed" style={{ color: t.muted }}>{topic.steps}</p>
            </div>
          ))}
        </div>

        <H2>Privacy and terms</H2>
        <P>
          For how we handle your data, including location, microphone, and motion, read our{" "}
          <Link to="/privacy" className="underline" style={{ color: t.text }}>Privacy Policy</Link>. For the rules that
          govern using the app, read our <Link to="/terms" className="underline" style={{ color: t.text }}>Terms of Service</Link>.
        </P>

        <H2>Still need help?</H2>
        <P>
          If you did not find an answer above, email {mail(SUPPORT_EMAIL)} and a person on our team will get back to you.
          For security concerns, write to {mail("security@cruzemaps.com")}.
        </P>

        <div className="mt-12 pt-8 border-t flex flex-wrap gap-x-6 gap-y-2 text-[15px]" style={{ borderColor: t.line }}>
          <Link to="/privacy" className="font-medium hover:text-white transition-colors" style={{ color: t.accent }}>Privacy Policy</Link>
          <Link to="/terms" className="font-medium hover:text-white transition-colors" style={{ color: t.accent }}>Terms of Service</Link>
        </div>
      </article>
    </LegalLayout>
  );
}
