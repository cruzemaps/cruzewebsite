import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const ImpactMapV2 = () => {
  const [savings, setSavings] = useState(12845920);

  // Simulate global savings ticking up
  useEffect(() => {
    const interval = setInterval(() => {
      setSavings(prev => prev + Math.floor(Math.random() * 50) + 10);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="impact-map" className="py-32 bg-[#05070A] relative overflow-hidden">
      
      {/* Map Background Pattern (Stylized Dotted Map Placeholder) */}
      <div className="absolute inset-0 opacity-30" 
           style={{ 
             backgroundImage: 'radial-gradient(circle at 70% 50%, rgba(0, 242, 255, 0.2) 0%, transparent 70%)' 
           }}>
        
        {/* Abstract Network Lines representing flow logic */}
        <div className="absolute left-0 top-0 w-1/2 h-full opacity-40">
           <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0,20 Q40,30 50,50 T100,80" fill="none" stroke="rgba(255,140,0,0.3)" strokeWidth="0.5" className="animate-[dash_10s_linear_infinite]" strokeDasharray="5,5" />
              <path d="M0,50 Q30,60 60,40 T100,30" fill="none" stroke="rgba(0,242,255,0.4)" strokeWidth="0.5" className="animate-[dash_8s_linear_infinite]" strokeDasharray="4,6" />
              <path d="M0,80 Q20,70 40,80 T100,50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.2" />
              <path d="M20,0 L20,100" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.1" />
              <path d="M40,0 L40,100" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.1" />
              <path d="M60,0 L60,100" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.1" />
              <path d="M80,0 L80,100" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.1" />
           </svg>
        </div>

        <div className="absolute top-1/2 left-2/3 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[1200px] max-h-[600px] flex flex-wrap gap-3 justify-center opacity-40">
           {/* Abstract nodes representing map points */}
           {[...Array(300)].map((_, i) => (
             <div key={i} className={`rounded-full ${Math.random() > 0.85 ? 'w-1.5 h-1.5 bg-brand-cyan animate-pulse shadow-[0_0_12px_#00F2FF]' : 'w-1 h-1 bg-white/20'}`} style={{
               animationDelay: `${Math.random() * 3}s`
             }}/>
           ))}
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-6xl relative z-10 flex flex-col md:flex-row items-center gap-16">
        
        {/* Left: Odometer Stats */}
        <div className="flex-1 space-y-8">
          <div className="inline-flex items-center space-x-2 text-brand-orange text-sm font-bold tracking-widest uppercase mb-4">
            <span className="w-2 h-2 bg-brand-orange rounded-full animate-pulse"></span>
            <span>Global Impact</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-display font-bold text-white leading-tight">
            The Compound Effect of Flow.
          </h2>
          
          <p className="text-xl text-white/60 font-body">
            Every vehicle using Cruze contributes to a smarter, faster, and greener global logistics network.
          </p>

          <div className="p-8 mt-8 border border-white/10 rounded-3xl bg-black/40 backdrop-blur-md shadow-2xl">
            <div className="text-sm font-bold text-white/50 uppercase tracking-widest mb-4">Total Dollars Saved by Partners</div>
            <div className="text-5xl md:text-7xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-[#00A3FF] tabular-nums tracking-tighter">
              ${savings.toLocaleString('en-US')}
            </div>
            
            <div className="grid grid-cols-2 gap-8 mt-8 pt-8 border-t border-white/10">
              <div>
                 <div className="text-2xl font-bold text-white mb-1">2.4M</div>
                 <div className="text-xs font-bold text-white/40 uppercase tracking-widest">Gallons Fuel Saved</div>
              </div>
              <div>
                 <div className="text-2xl font-bold text-white mb-1">11,500</div>
                 <div className="text-xs font-bold text-white/40 uppercase tracking-widest">Tons CO2 Prevented</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Map Visual Flair */}
        <div className="flex-1 relative min-h-[400px] w-full flex items-center justify-center">
            <div className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px]">
               <motion.div 
                 animate={{ rotate: 360 }}
                 transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
                 className="absolute inset-0 border border-white/5 rounded-full border-dashed"
               />
               <motion.div 
                 animate={{ rotate: -360 }}
                 transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
                 className="absolute inset-8 border border-brand-cyan/20 rounded-full border-dashed"
               />
               <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-gradient-to-r from-transparent via-brand-cyan/50 to-transparent" />
               <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-gradient-to-b from-transparent via-brand-orange/50 to-transparent" />
               
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-32 h-32 bg-brand-cyan/10 rounded-full animate-pulse shadow-[0_0_50px_rgba(0,242,255,0.2)] backdrop-blur-xl flex items-center justify-center border border-brand-cyan/30">
                    <span className="font-display font-bold text-white text-xl">CRUZE</span>
                 </div>
               </div>

               {/* Orbital Nodes */}
               <motion.div 
                 className="absolute top-0 left-1/2 w-4 h-4 bg-brand-orange rounded-full shadow-[0_0_15px_#FF8C00] -translate-x-1/2 -translate-y-1/2"
                 animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 2, repeat: Infinity }}
               />
               <motion.div 
                 className="absolute bottom-1/4 right-0 w-3 h-3 bg-brand-cyan rounded-full shadow-[0_0_15px_#00F2FF] translate-x-1/2 translate-y-1/2"
               />
            </div>
        </div>

      </div>
    </section>
  );
};

export default ImpactMapV2;
