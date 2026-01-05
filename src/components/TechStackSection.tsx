import { Smartphone, Cloud, Cpu, Code, Boxes, Glasses } from "lucide-react";

const TechStackSection = () => {
  const technologies = [
    {
      icon: Smartphone,
      name: "App Services",
      description: "Mobile & Web",
      color: "from-orange-500 to-amber-500"
    },
    {
      icon: Cpu,
      name: "Artificial Neural Networks",
      description: "Deep Learning Architecture",
      color: "from-amber-500 to-yellow-500"
    },
    {
      icon: Cloud,
      name: "Azure",
      description: "Cloud Infrastructure",
      color: "from-orange-600 to-orange-400"
    },
    {
      icon: Boxes,
      name: "Machine Learning",
      description: "Intelligent Systems",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: Code,
      name: "Python",
      description: "Core Development",
      color: "from-amber-600 to-orange-600"
    },
    {
      icon: Glasses,
      name: "VR/AR/MR",
      description: "Extended Reality",
      color: "from-orange-500 to-yellow-600"
    },
  ];

  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-glow opacity-20" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-12 md:mb-16">
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">
            Technology Stack
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mt-4 mb-4 md:mb-6">
            Powered by <span className="text-gradient">Cutting-Edge Technology</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto px-4">
            Our solution leverages industry-leading technologies to deliver
            unmatched performance and scalability.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
          {technologies.map((tech, index) => (
            <div
              key={tech.name}
              className="group relative p-6 sm:p-8 rounded-2xl bg-gradient-card border border-border/50 hover:border-primary/30 transition-all duration-500 hover:-translate-y-2 shadow-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="absolute inset-0 bg-gradient-glow opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />

              <div className="relative z-10">
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${tech.color} flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <tech.icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>

                <h3 className="text-lg sm:text-xl font-display font-semibold text-foreground mb-2">
                  {tech.name}
                </h3>

                <p className="text-sm sm:text-base text-muted-foreground">
                  {tech.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 md:mt-16 text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 rounded-full bg-secondary/50 border border-primary/20">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs sm:text-sm text-muted-foreground">Cloud-Native</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs sm:text-sm text-muted-foreground">AI-Powered</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs sm:text-sm text-muted-foreground">Scalable</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TechStackSection;
