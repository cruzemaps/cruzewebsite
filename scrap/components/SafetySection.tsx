import { ShieldCheck } from "lucide-react";

const SafetySection = () => {
    return (
        <section className="py-24 bg-background relative overflow-hidden">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row items-center gap-12 max-w-5xl mx-auto">
                    <div className="flex-1 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-6">
                            <ShieldCheck className="w-4 h-4" />
                            <span>Safety First</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">
                            Your Car. <span className="text-primary">Your Control.</span>
                        </h2>
                        <p className="text-xl text-muted-foreground leading-relaxed mb-6">
                            Cruze is a co-pilot, not an autopilot. We simply suggest the perfect speed to keep you moving.
                            You steer, you brake, you drive—we just clear the path ahead.
                        </p>
                        <p className="text-muted-foreground">
                            No hardware installation. No vehicle data override. Just a smarter way to drive differently, together.
                        </p>
                    </div>

                    <div className="flex-1 flex justify-center">
                        <div className="relative w-64 h-64 md:w-80 md:h-80 bg-gradient-card rounded-full flex items-center justify-center border border-border shadow-2xl animate-float">
                            <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl" />
                            <ShieldCheck className="w-32 h-32 md:w-40 md:h-40 text-primary opacity-80" strokeWidth={1} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SafetySection;
