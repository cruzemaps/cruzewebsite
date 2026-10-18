import { motion } from "framer-motion";

const SegmentSolutionsV2 = () => {
  const stats = [
    { label: "Fuel use", value: "Measured", color: "text-brand-cyan" },
    { label: "Hard-braking events", value: "Measured", color: "text-brand-orange" },
    { label: "Idle time", value: "Measured", color: "text-white" },
    { label: "Rear-end near-misses", value: "Measured", color: "text-brand-cyan" },
    { label: "Emissions", value: "Measured", color: "text-brand-orange" },
  ];

  return (
    <section className="py-24 bg-[#0B0E14]">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white">
            Solutions Built for Your Scale
          </h2>
          <p className="text-xl text-white/60">
            Every pilot is measured against a control group, regardless of your segment.
          </p>
        </div>

        {/* Content Card */}
        <div className="relative">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-[#121824] to-[#0A0D14] border border-white/10 rounded-3xl p-10 flex flex-col md:flex-row gap-10 overflow-hidden relative"
          >
            <div className="flex-1 flex flex-col justify-center space-y-6">
              <h3 className="text-3xl font-display font-bold text-white">
                For Fleet Managers & City Planners
              </h3>
              <p className="text-lg text-white/70 leading-relaxed font-body max-w-md">
                Built to cut the brake-then-accelerate cycle that burns the most diesel, through active speed harmonization and without installing a single piece of roadside hardware. Our pilots measure fuel use and hard-braking events against a control group.
              </p>
              
              <div className="pt-4">
                <button 
                  onClick={() => document.getElementById('impact-map')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-brand-orange font-bold uppercase tracking-wider text-sm flex items-center gap-2 hover:gap-3 transition-all"
                >
                  Explore the Impact Map &rarr;
                </button>
              </div>
            </div>

            {/* Dashboard / Stats Visualization */}
            <div className="flex-1 bg-black/40 rounded-2xl border border-white/5 p-8 flex flex-col justify-center gap-6 relative overflow-hidden backdrop-blur-sm">
              
              {/* Visual Flair Background */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-cyan/10 rounded-full blur-[80px]" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-brand-orange/10 rounded-full blur-[80px]" />

              {stats.map((stat, idx) => (
                <div key={idx} className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4 last:border-0 last:pb-0">
                  <span className="text-white/60 font-medium font-body">{stat.label}</span>
                  <span className={`text-sm uppercase tracking-widest font-display font-bold ${stat.color}`}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
};

export default SegmentSolutionsV2;
