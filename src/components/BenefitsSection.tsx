import { Fuel, Shield, BadgeDollarSign, Zap } from "lucide-react";
import { motion, useInView, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

const Counter = ({ value, suffix = "" }: { value: string; suffix?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const numericValue = parseInt(value.replace(/[^0-9]/g, ""));

  const springValue = useSpring(0, {
    stiffness: 100,
    damping: 30,
    duration: 2000,
  });

  const display = useTransform(springValue, (current) =>
    Math.round(current).toLocaleString()
  );

  useEffect(() => {
    if (isInView) {
      springValue.set(numericValue);
    }
  }, [isInView, springValue, numericValue]);

  useEffect(() => {
    display.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = latest + suffix;
      }
    });
  }, [display, suffix]);

  return <span ref={ref}>0{suffix}</span>;
};

const BenefitsSection = () => {
  const benefits = [
    {
      icon: Fuel,
      title: "$8,000+ Saved Per Truck",
      highlight: "8000",
      highlightSuffix: "+",
      highlightLabel: "Saved Per Truck",
      description: "Trucking fleets see massive annual savings through optimized speed pacing and reduced stop-and-go cycles.",
    },
    {
      icon: Shield,
      title: "75% Fewer Collisions",
      highlight: "75",
      highlightSuffix: "%",
      highlightLabel: "Rear-End Reduction",
      description: "Coordinated braking and acceleration dramatically reduces the primary cause of highway accidents.",
    },
    {
      icon: BadgeDollarSign,
      title: "30% Insurance Rebates",
      highlight: "30",
      highlightSuffix: "%",
      highlightLabel: "Premium Savings",
      description: "Insurance partners offer significant rebates for the measurably reduced risk of Cruze-enabled vehicles.",
    },
    {
      icon: Zap,
      title: "60% Jam Dissolution",
      highlight: "60",
      highlightSuffix: "%",
      highlightLabel: "Delay Elimination",
      description: "Phantom jams—the invisible enemy of highway efficiency—are systematically eliminated by swarm pacing.",
    },
  ];

  return (
    <section id="benefits" className="py-24 sm:py-32 relative overflow-hidden">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-serif font-medium mb-4">
            Benefits
          </h2>
          <p className="text-muted-foreground text-lg font-display">
            Features tell, but benefits sell.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.01 }}
              className="group relative p-8 rounded-3xl bg-gradient-card border border-border/50 hover:border-primary/30 transition-all duration-500 shadow-2xl overflow-hidden cursor-default"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

              <div className="flex items-start gap-6 relative z-10">
                <motion.div
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  className="w-14 h-14 rounded-2xl bg-secondary/50 border border-border/50 flex items-center justify-center transition-transform duration-500"
                >
                  <benefit.icon className="w-7 h-7 text-primary" />
                </motion.div>

                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-4xl font-serif font-bold text-gradient">
                      <Counter value={benefit.highlight} suffix={benefit.highlightSuffix} />
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{benefit.highlightLabel}</span>
                  </div>
                  <h3 className="text-xl font-serif font-medium text-foreground mb-3">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
