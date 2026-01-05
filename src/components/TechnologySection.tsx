import { Brain, Network, Waves, Eye, Cpu, GitBranch } from "lucide-react";

const TechnologySection = () => {
  const technologies = [
    {
      icon: Brain,
      title: "MAPPO-LCE Algorithm",
      description: "Decentralized Multi-Agent Reinforcement Learning where every app acts as an intelligent agent optimizing for maximum system throughput.",
    },
    {
      icon: Waves,
      title: "Physics-Informed Neural Network",
      description: "Embeds Aw-Rascle-Zhang fluid-dynamic equations to treat traffic as compressible fluid, predicting shockwaves with 73% higher accuracy.",
    },
    {
      icon: Eye,
      title: "YOLO-v11 Detection",
      description: "Real-time telemetry and camera processing detects stochastic congestion transitions in milliseconds for instant response.",
    },
    {
      icon: Network,
      title: "Graph Neural Network Twin",
      description: "Digital twin simulation enables predictive modeling and swarm coordination across the entire highway network.",
    },
    {
      icon: Cpu,
      title: "Swarm Intelligence",
      description: "Transforms smartphones into active traffic actuators, solving compliance and latency issues plaguing legacy platforms.",
    },
    {
      icon: GitBranch,
      title: "5% Control Model",
      description: "When just 5% of drivers follow Cruze's pacing, they stabilize flow for the entire highway—no infrastructure needed.",
    },
  ];

  return (
    <section id="technology" className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">Core Technology</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold mt-4 mb-6">
            Science That <span className="text-gradient">Moves Traffic</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Our breakthrough combines cutting-edge AI with traffic physics to create 
            the world's first active congestion dissolution system.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {technologies.map((tech, index) => (
            <div
              key={tech.title}
              className="group relative p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-500"
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6 group-hover:shadow-glow transition-shadow duration-500">
                <tech.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              
              <h3 className="text-xl font-display font-semibold text-foreground mb-3">
                {tech.title}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed">
                {tech.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TechnologySection;
