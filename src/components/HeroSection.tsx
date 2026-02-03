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

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4 sm:px-0 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <Button variant="hero" size="xl" className="group w-full sm:w-auto">
              Join the Revolution
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Video Placeholder */}
          <div className="mt-8 sm:mt-12 max-w-4xl mx-auto px-4 sm:px-0 animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <div className="relative aspect-video rounded-2xl bg-gradient-card border border-border/50 overflow-hidden group cursor-pointer hover:border-primary/50 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-glow opacity-50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/20 backdrop-blur-md flex items-center justify-center group-hover:bg-primary/30 transition-colors shadow-glow">
                  <Play className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4 text-center">
                <p className="text-xs sm:text-sm text-muted-foreground bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full inline-block">
                  Watch how Cruze works (2-3 minutes)
                </p>
              </div>
            </div>
          </div>

          {/* Company Logos for Social Proof */}
          <div className="mt-12 sm:mt-16 max-w-4xl mx-auto px-4 sm:px-0 animate-slide-up" style={{ animationDelay: "0.5s" }}>
            <p className="text-xs sm:text-sm text-muted-foreground text-center mb-6">Trusted by leading companies</p>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 opacity-60">
              {[
                "Company 1",
                "Company 2",
                "Company 3",
                "Company 4",
                "Company 5",
              ].map((company, index) => (
                <div
                  key={index}
                  className="h-8 sm:h-10 w-24 sm:w-32 rounded-lg bg-muted/50 flex items-center justify-center text-xs sm:text-sm text-muted-foreground font-medium"
                >
                  {company}
                </div>
              ))}
            </div>
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
