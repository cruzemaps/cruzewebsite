import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const HowItWorksSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const steps = [
    {
      number: "01",
      title: "Identify & Connect",
      description: "Advanced computer vision processes real-time telemetry and camera feeds to detect congestion transitions in milliseconds.",
    },
    {
      number: "02",
      title: "Process & Predict",
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
    <section id="how-it-works" className="py-24 sm:py-32 relative overflow-hidden bg-background" ref={containerRef}>
      {/* Decorative vertical line for the timeline */}
      <div className="absolute left-1/2 top-40 bottom-24 w-px bg-white/5 hidden lg:block" />

      {/* Animated progress line */}
      <motion.div
        className="absolute left-1/2 top-40 w-px bg-primary shadow-glow hidden lg:block"
        style={{ height: lineHeight, originY: 0 }}
      />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-6xl font-serif font-medium mb-6">
            How it works?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-display">
            Experience a smoother, safer journey with Cruze in just a few simple steps.
          </p>
        </motion.div>

        <div className="space-y-24 max-w-6xl mx-auto relative">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: index % 2 === 1 ? 50 : -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className={`relative grid grid-cols-1 lg:grid-cols-2 gap-12 items-center`}
            >
              {/* Timeline Dot */}
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                className="hidden lg:flex absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-primary items-center justify-center shadow-glow z-20"
              >
                <span className="text-primary-foreground font-display font-bold text-lg">{index + 1}</span>
              </motion.div>

              {/* Content Card */}
              <div className={`${index % 2 === 1 ? 'lg:order-2 lg:pl-16' : 'lg:pr-16 text-right'}`}>
                <motion.div
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="relative p-8 rounded-3xl bg-gradient-card border border-border/50 shadow-2xl group overflow-hidden cursor-default transition-colors hover:border-primary/20"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <span className={`text-6xl md:text-8xl font-serif font-bold opacity-10 absolute -top-8 ${index % 2 === 1 ? '-left-4' : '-right-4'}`}>
                    {step.number}
                  </span>
                  <h3 className="text-2xl md:text-3xl font-serif font-medium mb-4 relative z-10">{step.title}</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed relative z-10">
                    {step.description}
                  </p>
                </motion.div>
              </div>

              {/* Placeholder for the other side of the grid */}
              <div className={index % 2 === 1 ? 'lg:order-1' : ''} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
