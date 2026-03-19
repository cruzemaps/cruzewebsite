import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PlayCircle, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

const HeroSectionV2 = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden bg-brand-charcoal">
      {/* Background Mesh Gradient */}
      <div 
        className="absolute inset-0 z-0 opacity-40 mix-blend-screen"
        style={{
          backgroundImage: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(0, 242, 255, 0.15) 0%, transparent 40%),
                            radial-gradient(circle at 80% 20%, rgba(255, 140, 0, 0.1) 0%, transparent 40%)`,
        }}
      >
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Text Column */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col gap-6"
          >
            <h1 className="font-display font-bold text-5xl md:text-6xl text-white leading-tight">
              Stop Losing Margins to Traffic.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-[#FFB75E]">
                Start Dissolving Jams.
              </span>
            </h1>
            
            <p className="text-xl text-white/70 max-w-lg leading-relaxed font-body">
              The world's first active traffic intelligence platform. We don't just route you around traffic; we use swarm AI to eliminate it. 
              <br className="hidden md:block"/>
              <span className="text-white font-medium">Save $8,000+ per vehicle annually.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Button size="lg" className="bg-brand-orange hover:bg-brand-orange/90 text-[#0B0E14] rounded-full font-bold text-lg px-8 py-6 flex items-center gap-2 group tracking-wide">
                Get a Fleet Savings Estimate
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/5 rounded-full px-8 py-6 font-medium text-lg flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-brand-cyan" />
                Watch the 2-Minute Solution
              </Button>
            </div>
            
            <div className="flex items-center gap-4 mt-8">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-brand-charcoal bg-white/10 flex items-center justify-center backdrop-blur-md">
                   <div className="w-full h-full rounded-full bg-gradient-to-br from-white/20 to-transparent" />
                  </div>
                ))}
              </div>
              <div className="text-sm text-white/60">
                Join <strong className="text-white">500+</strong> innovative fleets.
              </div>
            </div>
          </motion.div>

          {/* Right Visual Column - Video Focal Point */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative w-full aspect-square md:aspect-video lg:aspect-square flex items-center justify-center p-4 lg:p-8"
          >
            {/* Immersive Glowing Backdrop */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] bg-gradient-to-tr from-brand-cyan/20 to-brand-orange/20 blur-[120px] rounded-full z-0 pointer-events-none" />
            
            {/* Premium Video Container */}
            <div className="relative w-full h-full text-left rounded-3xl md:rounded-[2.5rem] border border-white/20 bg-black/40 overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)] z-10 flex group cursor-pointer ring-1 ring-white/10 hover:ring-brand-cyan/50 hover:shadow-[0_0_80px_rgba(0,242,255,0.2)] transition-all duration-700">
                
                {/* Main Video */}
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover opacity-90 mix-blend-screen scale-105 group-hover:scale-100 transition-transform duration-1000"
                  src={`${import.meta.env.BASE_URL}cruze-web.mp4`} 
                />

                {/* Refined Glassmorphism Overlay */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-brand-charcoal/10 mix-blend-color pointer-events-none" />

                {/* Minimalist UI Elements over Video */}
                <div className="absolute top-6 left-6 flex items-center gap-3">
                  <div className="bg-black/60 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full flex items-center gap-2">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-cyan/20">
                      <div className="w-2 h-2 bg-brand-cyan rounded-full animate-pulse shadow-[0_0_10px_#00F2FF]" />
                    </div>
                    <span className="text-xs font-mono text-brand-cyan tracking-widest uppercase">
                      Live Feed
                    </span>
                  </div>
                </div>

                {/* Abstract Data Viz */}
                <div className="absolute bottom-8 left-8 right-8 z-20">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <div className="text-white/60 text-xs font-mono uppercase tracking-widest mb-1">Status</div>
                      <div className="text-2xl font-display font-medium text-white tracking-wide">Dissolving Shockwave</div>
                    </div>
                    
                    {/* Floating Data Badge */}
                    <div className="bg-white/10 text-white border border-white/20 px-4 py-2 rounded-xl backdrop-blur-xl flex items-center gap-2 shadow-2xl translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                         <span className="text-xs font-mono uppercase text-white/60">Flow</span>
                         <span className="text-brand-cyan font-bold">+86%</span>
                    </div>
                  </div>

                  {/* Clean Progress Wave */}
                  <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/10">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-brand-cyan via-white to-brand-orange w-full rounded-full"
                      initial={{ x: "-100%" }}
                      animate={{ x: "0%" }}
                      transition={{ duration: 2, ease: "easeOut" }}
                    />
                  </div>
                </div>
                
                {/* Center Play Button for Interaction */}
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                  <div className="w-20 h-20 rounded-full bg-white/5 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500 shadow-2xl">
                     <PlayCircle className="w-10 h-10 text-white opacity-90" strokeWidth={1.5} />
                  </div>
                </div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default HeroSectionV2;
