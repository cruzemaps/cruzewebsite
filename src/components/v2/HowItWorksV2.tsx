import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Activity, Cpu, Smartphone } from "lucide-react";

const HowItWorksV2 = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const steps = [
    {
      title: "The Pulse",
      description: "NeuralSwarm AI detects transitions and micro-changes in traffic state before a jam fully forms.",
      icon: Activity,
      color: "text-brand-orange",
      bgOverlay: "from-brand-orange/10 via-transparent to-transparent",
    },
    {
      title: "The Logic",
      description: "Physics-based prediction models—more accurate than standard mapping applications—determine the optimal pacing speed.",
      icon: Cpu,
      color: "text-brand-cyan",
      bgOverlay: "from-brand-cyan/10 via-transparent to-transparent",
    },
    {
      title: "The Action",
      description: "Micro-adjustments are delivered directly to drivers, instructing them to hold a specific speed to dissolve the shockwave ahead.",
      icon: Smartphone,
      color: "text-white",
      bgOverlay: "from-white/5 via-transparent to-transparent",
    }
  ];

  return (
    <section ref={containerRef} className="py-32 bg-[#0B0E14] relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-6xl">
        
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            The Physics of Flow
          </h2>
          <p className="text-xl text-white/60">
            How we turn chaos into harmony.
          </p>
        </div>

        <div className="relative">
          {/* Vertical Timeline Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/10 -translate-x-1/2 hidden md:block">
             <motion.div 
               className="absolute top-0 w-full bg-gradient-to-b from-brand-orange to-brand-cyan" 
               style={{ height: useTransform(scrollYProgress, [0, 1], ["0%", "100%"]) }}
             />
          </div>

          <div className="space-y-32">
            {steps.map((step, idx) => {
              const isEven = idx % 2 === 0;
              const Icon = step.icon;

              return (
                <div key={idx} className={`flex flex-col md:flex-row items-center gap-12 ${isEven ? 'md:flex-row-reverse' : ''}`}>
                  
                  {/* Text Content */}
                  <div className="flex-1 flex flex-col gap-6 w-full text-center md:text-left">
                    <div className={`p-4 rounded-2xl w-fit ${isEven ? 'md:ml-auto' : ''} bg-black/40 border border-white/10 backdrop-blur-md mx-auto md:mx-0`}>
                      <Icon className={`w-8 h-8 ${step.color}`} />
                    </div>
                    <h3 className={`text-3xl font-display font-bold text-white ${isEven ? 'md:text-right' : ''}`}>
                      <span className="text-white/40 text-lg block mb-2 font-mono">STEP 0{idx + 1}</span>
                      {step.title}
                    </h3>
                    <p className={`text-lg text-white/60 leading-relaxed font-body ${isEven ? 'md:text-right' : ''}`}>
                      {step.description}
                    </p>
                  </div>

                  {/* Visual Node */}
                  <div className="hidden md:flex flex-none w-16 justify-center relative z-10">
                    <motion.div 
                      className="w-8 h-8 rounded-full bg-[#0B0E14] border-4 border-white/20 relative"
                      whileInView={{ borderColor: ['rgba(255,255,255,0.2)', '#00F2FF', '#FF8C00'] }}
                      transition={{ duration: 1.5 }}
                    >
                      <div className="absolute inset-1 rounded-full bg-white/80" />
                    </motion.div>
                  </div>

                  {/* Scrolly Visual Element */}
                  <div className="flex-1 w-full flex justify-center">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6 }}
                      className="w-full max-w-sm aspect-square rounded-3xl bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] border border-white/10 relative overflow-hidden group flex items-center justify-center p-8"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br opacity-50 ${step.bgOverlay} transition-opacity duration-500 group-hover:opacity-100`} />
                      
                      {/* Visual for Step 1: The Pulse */}
                      {idx === 0 && (
                        <div className="relative w-full h-full border border-white/5 rounded-full flex items-center justify-center border-dashed animate-[spin_20s_linear_infinite]">
                          <div className="w-2/3 h-2/3 border border-brand-orange/30 rounded-full flex items-center justify-center border-dashed">
                             <div className="w-1/3 h-1/3 bg-brand-orange/50 rounded-full shadow-[0_0_30px_#FF8C00]" />
                          </div>
                        </div>
                      )}

                      {/* Visual for Step 2: The Logic (Fixed missing visual) */}
                      {idx === 1 && (
                        <div className="w-full flex items-center gap-1.5 px-4 h-full relative z-10">
                           {/* A clear logic wave / neural network visualization */}
                          {[...Array(16)].map((_, i) => (
                            <motion.div 
                              key={i}
                              animate={{ height: ['20%', '80%', '20%'] }}
                              transition={{ duration: 1.5 + (Math.random() * 0.5), repeat: Infinity, delay: i * 0.1 }}
                              className="w-full bg-brand-cyan shadow-[0_0_15px_#00F2FF] rounded-full"
                              style={{ height: '20%' }}
                            />
                          ))}
                        </div>
                      )}

                      {idx === 2 && (
                        <div className="w-48 h-full border-4 border-[#333] rounded-[3rem] bg-black p-4 relative shadow-2xl flex items-center justify-center">
                           <div className="text-center">
                             <div className="text-brand-orange text-xs font-bold mb-2 uppercase tracking-widest animate-pulse">Cruze Active</div>
                             <div className="text-4xl font-display font-bold text-white mb-1">55<span className="text-lg text-white/50">mph</span></div>
                             <div className="text-[10px] text-white/50 font-mono">maintain to dissolve ahead</div>
                           </div>
                        </div>
                      )}

                    </motion.div>
                  </div>

                </div>
              );
            })}
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="flex justify-center mt-32"
          >
            <div className="bg-white/5 border border-brand-cyan/40 px-8 py-4 rounded-full flex items-center gap-4 backdrop-blur-md shadow-[0_0_30px_rgba(0,242,255,0.1)]">
               <div className="w-3 h-3 bg-brand-cyan rounded-full animate-pulse shadow-[0_0_10px_#00F2FF]" />
               <span className="font-display font-bold text-white tracking-widest uppercase">Stability 100%</span>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default HowItWorksV2;
