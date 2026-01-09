import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 sm:pt-20">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-glow opacity-50" />
      <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-40 h-40 sm:w-80 sm:h-80 bg-accent/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1s" }} />

      {/* Animated Flow Line */}
      <div className="absolute top-1/2 left-0 right-0 h-px animate-flow opacity-30" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full border border-primary/20 bg-primary/10 backdrop-blur-md mb-6 sm:mb-8 animate-slide-up shadow-glow">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs sm:text-sm text-muted-foreground font-medium">
              Revolutionary Traffic Intelligence
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold mb-4 sm:mb-6 leading-tight px-4 sm:px-0 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Stop Avoiding Jams.
            <br />
            <span className="text-gradient">Start Dissolving Them.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-4 sm:px-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            Cruze transforms every smartphone into an active traffic actuator. Our swarm intelligence
            coordinates driver speeds to eliminate phantom jams—saving fuel, time, and lives.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4 sm:px-0 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <Button variant="hero" size="xl" className="group w-full sm:w-auto">
              Join the Revolution
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="heroOutline" size="xl" className="group w-full sm:w-auto">
              <Play className="w-4 h-4" />
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 mt-12 sm:mt-20 max-w-2xl mx-auto px-4 sm:px-0 animate-slide-up" style={{ animationDelay: "0.4s" }}>
            {[
              { value: "73%", label: "Higher Accuracy" },
              { value: "60%", label: "Jams Eliminated" },
              { value: "24%", label: "Fuel Savings" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-gradient mb-1 sm:mb-2">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="hidden sm:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-primary rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
