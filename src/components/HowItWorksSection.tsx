const HowItWorksSection = () => {
  const steps = [
    {
      number: "01",
      title: "Detect & Analyze",
      description: "Advanced computer vision processes real-time telemetry and camera feeds to detect congestion transitions in milliseconds.",
    },
    {
      number: "02",
      title: "Predict & Model",
      description: "Our AI models traffic like a fluid, predicting shockwaves and slowdowns before they propagate with 73% higher accuracy.",
    },
    {
      number: "03",
      title: "Coordinate & Pace",
      description: "Cruze's intelligent pacing algorithm calculates precise micro-adjustments in velocity and communicates them to drivers in real-time.",
    },
    {
      number: "04",
      title: "Dissolve & Flow",
      description: "Coordinated speed harmonization dissolves phantom jams, creating smooth traffic flow that benefits all road users.",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      <div className="absolute left-1/2 top-32 bottom-32 w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent hidden lg:block" />

      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-display font-bold mt-4 mb-6">
            How it works?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Break down your product's functionality into 3-5 easy steps.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`flex items-center gap-8 mb-12 last:mb-0 ${index % 2 === 1 ? "lg:flex-row-reverse" : ""
                }`}
            >
              <div className={`flex-1 ${index % 2 === 1 ? "lg:text-right" : ""}`}>
                <div className="p-8 rounded-2xl bg-gradient-card border border-border/50 hover:border-primary/30 transition-all duration-500 group shadow-card">
                  <div className="text-6xl font-display font-bold text-gradient opacity-50 mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-2xl font-display font-bold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>

              <div className="hidden lg:flex w-16 h-16 flex-shrink-0 rounded-full bg-gradient-primary items-center justify-center shadow-glow z-10">
                <span className="text-primary-foreground font-display font-bold text-xl">
                  {index + 1}
                </span>
              </div>

              <div className="hidden lg:block flex-1" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
