import { AlertTriangle, DollarSign, Clock, Car } from "lucide-react";

const ProblemSection = () => {
  const problems = [
    {
      icon: DollarSign,
      stat: "$269B",
      label: "Annual Congestion Cost",
      description: "The economic burden of traffic congestion on the US economy",
    },
    {
      icon: Clock,
      stat: "54 hrs",
      label: "Lost Per Driver Yearly",
      description: "Average time wasted sitting in traffic per commuter",
    },
    {
      icon: Car,
      stat: "60%",
      label: "Phantom Jam Share",
      description: "Of highway delays caused by shockwave propagation",
    },
    {
      icon: AlertTriangle,
      stat: "1.35M",
      label: "Annual Road Deaths",
      description: "Global fatalities from traffic-related incidents",
    },
  ];

  return (
    <section className="py-16 sm:py-20 md:py-24 relative">
      <div className="absolute inset-0 bg-gradient-glow opacity-30" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-12 sm:mb-16">
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">The Problem</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mt-4 mb-4 sm:mb-6 px-4 sm:px-0">
            Traffic Is a <span className="text-gradient">$269 Billion Crisis</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto px-4 sm:px-6">
            Current navigation apps are passive observers—they merely redistribute congestion
            rather than solve it. The result? A crisis that costs billions and claims lives.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {problems.map((problem, index) => (
            <div
              key={problem.label}
              className="group relative p-6 sm:p-8 rounded-2xl bg-gradient-card border border-border/50 hover:border-primary/30 transition-all duration-500 hover:-translate-y-2 shadow-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="absolute inset-0 bg-gradient-glow opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-primary/20 transition-colors">
                  <problem.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-3xl sm:text-4xl font-display font-bold text-gradient mb-2">
                  {problem.stat}
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                  {problem.label}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {problem.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
