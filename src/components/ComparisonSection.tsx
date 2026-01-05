import { Check, X } from "lucide-react";

const ComparisonSection = () => {
  const features = [
    { feature: "Active Traffic Dissolution", cruze: true, others: false },
    { feature: "Swarm Intelligence Coordination", cruze: true, others: false },
    { feature: "Physics-Based Prediction", cruze: true, others: false },
    { feature: "Real-Time Shockwave Prevention", cruze: true, others: false },
    { feature: "5% Control Network Effect", cruze: true, others: false },
    { feature: "Basic Route Guidance", cruze: true, others: true },
    { feature: "Traffic Visualization", cruze: true, others: true },
    { feature: "ETA Estimation", cruze: true, others: true },
  ];

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">The Difference</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold mt-4 mb-6">
            Actuator vs. <span className="text-gradient">Observer</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Google and Waze are passive observers that merely redistribute congestion. 
            Cruze is an active actuator that dissolves it at the source.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-border overflow-hidden bg-card shadow-card">
            {/* Header */}
            <div className="grid grid-cols-3 gap-4 p-6 border-b border-border bg-secondary/30">
              <div className="text-sm font-medium text-muted-foreground">Capability</div>
              <div className="text-center">
                <span className="font-display font-bold text-gradient text-lg">Cruze</span>
              </div>
              <div className="text-center">
                <span className="font-medium text-muted-foreground">Google / Waze</span>
              </div>
            </div>

            {/* Rows */}
            {features.map((item, index) => (
              <div
                key={item.feature}
                className={`grid grid-cols-3 gap-4 p-6 ${
                  index !== features.length - 1 ? "border-b border-border/50" : ""
                } hover:bg-secondary/20 transition-colors`}
              >
                <div className="text-foreground font-medium">{item.feature}</div>
                <div className="flex justify-center">
                  {item.cruze ? (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
                      <X className="w-5 h-5 text-destructive" />
                    </div>
                  )}
                </div>
                <div className="flex justify-center">
                  {item.others ? (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Check className="w-5 h-5 text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
                      <X className="w-5 h-5 text-destructive" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;
