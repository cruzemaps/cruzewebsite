import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Truck, Building2, User } from "lucide-react";

type Segment = "logistics" | "government" | "consumer";

const SegmentSolutionsV2 = () => {
  const [activeSegment, setActiveSegment] = useState<Segment>("logistics");

  const segmentData = {
    logistics: {
      title: "For Fleet Managers",
      description: "Reduce fuel costs by 12% and lower insurance premiums by 30% through active speed harmonization.",
      stats: [
        { label: "Fuel Saved", value: "12%", color: "text-brand-cyan" },
        { label: "Driver Retention", value: "+15%", color: "text-brand-orange" },
        { label: "Idle Time Reduced", value: "40%", color: "text-white" },
      ]
    },
    government: {
      title: "For City Planners",
      description: "Reduce rear-end collisions by 75% without installing a single piece of roadside hardware.",
      stats: [
        { label: "Collisions Prevented", value: "75%", color: "text-brand-cyan" },
        { label: "Throughput Increase", value: "+18%", color: "text-brand-orange" },
        { label: "Emissions Drop", value: "30%", color: "text-white" },
      ]
    },
    consumer: {
      title: "For OEMs & Tier 1s",
      description: "Embed 'Active Flow' into your navigation stack via our lightweight Rust-based SDK.",
      stats: [
        { label: "Integration Time", value: "< 2 Wks", color: "text-brand-cyan" },
        { label: "SDK Size", value: "2MB", color: "text-brand-orange" },
        { label: "Latency", value: "12ms", color: "text-white" },
      ]
    }
  };

  const segments = [
    { id: "logistics", label: "Logistics", icon: Truck },
    { id: "government", label: "Government", icon: Building2 },
    { id: "consumer", label: "Consumer (OEMs)", icon: User },
  ];

  return (
    <section className="py-24 bg-[#0B0E14]">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white">
            Solutions Built for Your Scale
          </h2>
          <p className="text-xl text-white/60">
            Immediate ROI, regardless of your segment.
          </p>
        </div>

        {/* 3-Way Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-white/5 p-1.5 rounded-2xl flex gap-2 backdrop-blur-md border border-white/10">
            {segments.map((segment) => {
              const Icon = segment.icon;
              const isActive = activeSegment === segment.id;
              
              return (
                <button
                  key={segment.id}
                  onClick={() => setActiveSegment(segment.id as Segment)}
                  className={`
                    flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300
                    ${isActive 
                      ? "bg-brand-orange text-[#0B0E14] shadow-lg shadow-brand-orange/20" 
                      : "text-white/60 hover:text-white hover:bg-white/5"}
                  `}
                >
                  <Icon size={18} />
                  {segment.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Card */}
        <div className="relative h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSegment}
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -90, opacity: 0 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
              className="absolute inset-0 bg-gradient-to-br from-[#121824] to-[#0A0D14] border border-white/10 rounded-3xl p-10 flex flex-col md:flex-row gap-10 overflow-hidden"
              style={{ transformStyle: "preserve-3d", transformOrigin: "center" }}
            >
              <div className="flex-1 flex flex-col justify-center space-y-6">
                <h3 className="text-3xl font-display font-bold text-white">
                  {segmentData[activeSegment].title}
                </h3>
                <p className="text-lg text-white/70 leading-relaxed font-body max-w-md">
                  {segmentData[activeSegment].description}
                </p>
                
                <div className="pt-4">
                  <button className="text-brand-orange font-bold uppercase tracking-wider text-sm flex items-center gap-2 hover:gap-3 transition-all">
                    Explore Case Studies &rarr;
                  </button>
                </div>
              </div>

              {/* Dashboard / Stats Visualization */}
              <div className="flex-1 bg-black/40 rounded-2xl border border-white/5 p-8 flex flex-col justify-center gap-8 relative overflow-hidden backdrop-blur-sm">
                
                {/* Visual Flair Background */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-cyan/10 rounded-full blur-[80px]" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-brand-orange/10 rounded-full blur-[80px]" />

                {segmentData[activeSegment].stats.map((stat, idx) => (
                  <div key={idx} className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4 last:border-0 last:pb-0">
                    <span className="text-white/60 font-medium font-body">{stat.label}</span>
                    <span className={`text-4xl font-display font-bold ${stat.color} tracking-tight`}>
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
};

export default SegmentSolutionsV2;
