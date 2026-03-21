import { Check, X } from "lucide-react";

const ComparisonV2 = () => {
  const capabilities = [
    { name: "Active Traffic Dissolution", cruze: true, waze: false },
    { name: "Swarm Intelligence Coordination", cruze: true, waze: false },
    { name: "Physics-Based Prediction", cruze: true, waze: false },
    { name: "Real-Time Shockwave Prevention", cruze: true, waze: false },
    { name: "5% Control Network Effect", cruze: true, waze: false },
    { name: "Basic Route Guidance", cruze: true, waze: true },
    { name: "Traffic Visualization", cruze: true, waze: true },
    { name: "ETA Estimation", cruze: true, waze: true },
  ];

  return (
    <section className="py-24 bg-[#0B0E14] relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white tracking-wide">
            Actuator vs. <span className="text-brand-orange">Observer</span>
          </h2>
          <p className="text-xl text-white/50 max-w-3xl mx-auto leading-relaxed pt-2">
            Google and Waze are passive observers that merely redistribute congestion.<br />
            Cruze is an active actuator that dissolves it at the source.
          </p>
        </div>

        {/* Table Container */}
        <div className="w-full bg-[#0F131A] rounded-xl border border-white/[0.05] overflow-hidden mt-12 shadow-2xl">
          
          {/* Header */}
          <div className="grid grid-cols-[1fr,100px,100px] sm:grid-cols-[1fr,150px,150px] md:grid-cols-[1fr,200px,200px] items-center px-6 sm:px-8 py-5 border-b border-white/[0.05] bg-black/20">
            <div className="text-sm font-medium text-slate-400">Capability</div>
            <div className="text-center font-bold text-brand-orange text-base md:text-lg">Cruze</div>
            <div className="text-center font-medium text-slate-400 text-sm md:text-base">Google / Waze</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/[0.05]">
            {capabilities.map((cap) => (
              <div 
                key={cap.name} 
                className="grid grid-cols-[1fr,100px,100px] sm:grid-cols-[1fr,150px,150px] md:grid-cols-[1fr,200px,200px] items-center px-6 sm:px-8 py-5 hover:bg-white/[0.02] transition-colors"
              >
                <div className="text-sm sm:text-base font-medium text-white/90">
                  {cap.name}
                </div>
                
                {/* Cruze Check */}
                <div className="flex justify-center">
                  <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-brand-orange/10 flex items-center justify-center border border-brand-orange/20 shadow-[0_0_15px_rgba(255,140,0,0.15)]">
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-brand-orange" strokeWidth={2.5} />
                  </div>
                </div>

                {/* Waze Check/Cross */}
                <div className="flex justify-center">
                  {cap.waze ? (
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-slate-500/10 flex items-center justify-center border border-slate-500/20">
                      <Check className="w-4 h-4 md:w-5 md:h-5 text-slate-400" strokeWidth={2.5} />
                    </div>
                  ) : (
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                      <X className="w-4 h-4 md:w-5 md:h-5 text-red-500" strokeWidth={2.5} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

export default ComparisonV2;
