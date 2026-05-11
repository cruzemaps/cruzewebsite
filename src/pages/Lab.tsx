import NavbarV2 from "@/components/v2/NavbarV2";
import InteractiveLabV2 from "@/components/v2/InteractiveLabV2";
import SEO from "@/components/SEO";

// Hidden internal test page for the live-CV camera lab. Not linked from the
// navbar or sitemap. Reachable only by typing /lab into the URL. The SEO
// component emits a noindex meta so accidental discovery doesn't index it.
export default function Lab() {
    return (
        <div className="min-h-screen bg-brand-charcoal text-white font-body selection:bg-brand-cyan/30">
            <SEO />
            <NavbarV2 />
            <section className="pt-28 pb-6 border-b border-white/5">
                <div className="container mx-auto px-6 max-w-5xl">
                    <p className="text-xs font-bold tracking-widest uppercase text-brand-orange mb-2">
                        Internal — Camera CV Lab
                    </p>
                    <h1 className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight mb-3">
                        Live frame analysis sandbox
                    </h1>
                    <p className="text-sm text-white/55 max-w-3xl">
                        This page is hidden from the public site. It exists so the camera-feed CV pipeline
                        (frame capture → ROI mask → Claude vision → telemetry) can be iterated on without
                        touching the investor flow. Pick a camera, draw an ROI, watch the top-right badge —
                        "Live AI Vision" means the worker reached Claude; "Simulation Mode" means we're
                        falling back to regime data.
                    </p>
                </div>
            </section>
            <InteractiveLabV2 />
        </div>
    );
}
