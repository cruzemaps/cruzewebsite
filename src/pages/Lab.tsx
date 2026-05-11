import { useEffect } from "react";
import NavbarV2 from "@/components/v2/NavbarV2";
import InteractiveLabV2 from "@/components/v2/InteractiveLabV2";
import SEO from "@/components/SEO";

// Hidden internal test page for the live-CV camera lab. Not linked from the
// navbar or sitemap. Reachable only by typing /lab into the URL. The SEO
// component emits a noindex meta so accidental discovery doesn't index it.
export default function Lab() {
    // Pre-warm the YOLO model. coco-ssd's TFJS chunk (~1.3MB gz) plus weights
    // (~5MB) take 2-4s to fetch on a typical connection. Kicking the imports
    // here means they happen during page chrome render rather than after the
    // user clicks a camera card, which is when the perceived "is anything
    // happening?" window opens. By the time the user opens the modal, the
    // chunks are usually in the browser cache and detection starts almost
    // immediately.
    useEffect(() => {
        const prewarm = async () => {
            try {
                const [tf] = await Promise.all([
                    import("@tensorflow/tfjs"),
                    import("@tensorflow-models/coco-ssd"),
                ]);
                // Touching tf.ready forces the WebGL backend to initialize so
                // the first detect() call inside YoloOverlay doesn't pay that
                // cost either.
                await tf.ready();
            } catch {
                // No-op — YoloOverlay will surface its own error state if the
                // imports fail on the actual run.
            }
        };
        prewarm();
    }, []);

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
                        Live YOLO vehicle detection
                    </h1>
                    <p className="text-sm text-white/55 max-w-3xl">
                        Single San Antonio IH-10 feed with COCO-SSD running in-browser. Boxes appear around
                        every detected vehicle and refresh ~3 times per second. Click the camera, draw an ROI,
                        and the telemetry panel reflects the count of vehicles inside your polygon — no
                        server-side vision call, all CV happens client-side.
                    </p>
                </div>
            </section>
            <InteractiveLabV2 />
        </div>
    );
}
