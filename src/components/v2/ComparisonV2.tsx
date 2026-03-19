import { useState, useRef, useEffect } from "react";
import { ArrowLeftRight } from "lucide-react";
import { motion } from "framer-motion";

const ComparisonV2 = () => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPosition(percent);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    handleMove(e.clientX);
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!isDragging.current) return;
    handleMove(e.touches[0].clientX);
  };

  const stopDragging = () => {
    isDragging.current = false;
  };

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", stopDragging);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", stopDragging);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", stopDragging);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", stopDragging);
    };
  }, []);

  return (
    <section className="py-24 bg-[#0B0E14] border-y border-white/5 relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white">
            Why Legacy GPS Fails
          </h2>
          <p className="text-xl text-white/60">
            Waze and Google Maps tell you where the jam is.<br />
            <span className="text-brand-cyan">Cruze tells your fleet how to stop it from forming.</span>
          </p>
        </div>

        {/* Before & After Slider Container */}
        <div 
          ref={containerRef}
          className="relative w-full h-[400px] md:h-[500px] rounded-3xl overflow-hidden cursor-ew-resize select-none bg-[#1A0F14]"
          onMouseDown={(e) => {
            isDragging.current = true;
            handleMove(e.clientX);
          }}
          onTouchStart={(e) => {
            isDragging.current = true;
            handleMove(e.touches[0].clientX);
          }}
        >
          {/* Base Layer: Cruze Model (Right / Underneath) */}
          <div className="absolute inset-0 w-full h-full p-8 flex flex-col justify-center bg-[#050C0D] overflow-hidden">
             
             {/* Abstract Grid Background */}
             <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(0, 242, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 242, 255, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

             <div className="absolute top-8 right-8 bg-black/60 border border-brand-cyan/50 text-brand-cyan px-6 py-3 rounded-full text-sm font-bold tracking-widest uppercase backdrop-blur-md z-10 shadow-[0_0_20px_rgba(0,242,255,0.3)]">
               Cruze Model: Proactive
             </div>

             {/* Clean Fluid Wave Pattern */}
             <div className="w-full flex flex-col gap-12 opacity-90 mt-12 h-full justify-center relative">
               
               {/* Glowing flow background */}
               <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-32 bg-brand-cyan/10 blur-[80px] rounded-full z-0 pointer-events-none" />

               {[1, 2, 3].map((lane) => (
                 <div key={lane} className="relative h-1 w-full bg-[#0A1A1C] flex items-center">
                   <motion.div 
                      className="absolute h-[3px] w-[60%] bg-gradient-to-r from-transparent via-brand-cyan to-transparent shadow-[0_0_20px_#00F2FF]"
                      initial={{ left: "-60%" }}
                      animate={{ left: "100%" }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: lane * 0.5 }}
                    />
                 </div>
               ))}
             </div>
          </div>

          {/* Overlay Layer: Legacy Model (Left / Snipped) */}
          <div 
            className="absolute inset-0 w-full h-full bg-[#180A0A] p-8 flex flex-col justify-center border-r border-red-500/20 overflow-hidden"
            style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
          >
             
             {/* Abstract Grid Background */}
             <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(239, 68, 68, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(239, 68, 68, 0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

             <div className="absolute top-8 left-8 bg-black/60 border border-red-500/50 text-red-500 px-6 py-3 rounded-full text-sm font-bold tracking-widest uppercase backdrop-blur-md z-10 shadow-[0_0_20px_rgba(239,68,68,0.2)] truncate max-w-full">
               Legacy Model: Reactive
             </div>
             
             {/* Clean "Stop & Go" Wave Pattern */}
             <div className="w-full flex flex-col gap-12 opacity-90 mt-12 relative h-full justify-center">
               
               {/* Fixed glowing core of the jam */}
               <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-48 h-48 bg-red-600/20 blur-[80px] rounded-full z-0 pointer-events-none" />

               {[1, 2, 3].map((lane) => (
                 <div key={lane} className="relative h-1 w-full bg-red-950 flex items-center">
                    {/* Simulated pulse of stopping traffic */}
                    <motion.div 
                      className="absolute h-[2px] w-[30%] bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_15px_#f00]"
                      animate={{ 
                        left: ["-30%", "20%", "25%", "100%"],
                        opacity: [0, 1, 1, 0]
                      }}
                      transition={{ 
                        duration: 4, 
                        repeat: Infinity, 
                        ease: "easeOut",
                        delay: lane * 1.5
                      }}
                    />
                 </div>
               ))}
             </div>
          </div>

          {/* Slider Handle (Cleaned up, Stronger/Thicker) */}
          <div 
            className="absolute top-0 bottom-0 w-1.5 bg-gradient-to-b from-transparent via-white to-transparent cursor-ew-resize z-20 hover:w-2.5 transition-all flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.5)] group"
            style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
          >
            <div className="w-16 h-16 bg-black border-[3px] border-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.4)] text-white transform group-hover:scale-110 transition-transform">
               <ArrowLeftRight size={28} strokeWidth={2} />
            </div>
          </div>

        </div>
        
        <div className="mt-12 text-center max-w-2xl mx-auto">
          <p className="text-white/60 text-lg">
            Drag the slider to experience the difference between reactive routing and proactive traffic dissolving.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ComparisonV2;
