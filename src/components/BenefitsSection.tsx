import { Fuel, Shield, BadgeDollarSign, Zap } from "lucide-react";

const BenefitsSection = () => {
  const benefits = [
    {
      icon: Fuel,
      title: "$8,000+ Saved Per Truck",
      highlight: "24%",
      highlightLabel: "Fuel Efficiency Boost",
      description: "Trucking fleets see massive annual savings through optimized speed pacing and reduced stop-and-go cycles.",
    },
    {
      icon: Shield,
      title: "75% Fewer Collisions",
      highlight: "75%",
      highlightLabel: "Rear-End Reduction",
      description: "Coordinated braking and acceleration dramatically reduces the primary cause of highway accidents.",
    },
    {
      icon: BadgeDollarSign,
      title: "30% Insurance Rebates",
      highlight: "30%",
      highlightLabel: "Premium Savings",
      description: "Insurance partners offer significant rebates for the measurably reduced risk of Cruze-enabled vehicles.",
    },
    {
      icon: Zap,
      title: "60% Jam Dissolution",
      highlight: "60%",
      highlightLabel: "Delay Elimination",
      description: "Phantom jams—the invisible enemy of highway efficiency—are systematically eliminated by swarm pacing.",
    },
  ];

  return (
    <section id="benefits" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-glow opacity-20" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-primary opacity-30" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold mt-4 mb-6">
            Benefits
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Features tell, but benefits sell.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {benefits.map((benefit, index) => (
            <div
              key={benefit.title}
              className="group flex gap-6 p-8 rounded-2xl bg-gradient-card border border-border/50 hover:border-primary/30 transition-all duration-500 shadow-card"
            >
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <benefit.icon className="w-8 h-8 text-primary" />
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-5xl font-display font-bold text-gradient">
                    {benefit.highlight}
                  </span>
                  <span className="text-sm text-muted-foreground font-medium">
                    {benefit.highlightLabel}
                  </span>
                </div>
                
                <h3 className="text-xl font-display font-semibold text-foreground mb-2">
                  {benefit.title}
                </h3>
                
                <p className="text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
