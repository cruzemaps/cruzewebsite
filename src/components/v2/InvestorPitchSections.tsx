import { motion } from "framer-motion";
import {
  Brain,
  Cpu,
  Radio,
  DollarSign,
  Target,
  Trophy,
  Calendar,
  Sparkles,
  Network,
  Eye,
  Gauge,
} from "lucide-react";

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.45 },
};

const InvestorPitchSections = () => {
  return (
    <div className="bg-brand-charcoal border-t border-white/10">
      {/* Company overview */}
      <section id="investor-overview" className="py-20 md:py-28">
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.div {...fadeIn} className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-brand-cyan border border-white/10 text-xs font-bold tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Company
            </span>
            <h2 className="mt-4 text-3xl md:text-4xl font-display font-bold text-white">
              Navigate Smarter
            </h2>
            <p className="mt-3 text-lg text-white/60 max-w-2xl mx-auto">
              Cruze addresses the <span className="text-white font-medium">$269B physics flaw</span> in the
              U.S. supply chain by preventing phantom jams and eliminating human latency in how vehicles
              respond to the road.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Founders",
                body: "Architected by AI and data science founders from UTSA and the CARE AI Lab.",
                icon: Brain,
              },
              {
                title: "Technical status",
                body: "Hardware-agnostic V2X at Technology Readiness Level 5 (TRL 5). Software-first, built to scale without proprietary roadside units.",
                icon: Cpu,
              },
              {
                title: "North star",
                body: "Turn every connected vehicle into an actuator that damps shockwaves instead of amplifying them.",
                icon: Network,
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                {...fadeIn}
                transition={{ ...fadeIn.transition, delay: i * 0.05 }}
                className="bg-gradient-to-br from-[#121824] to-[#0A0D14] border border-white/10 rounded-2xl p-6"
              >
                <item.icon className="w-8 h-8 text-brand-orange mb-4" />
                <h3 className="font-display font-bold text-white text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology */}
      <section id="investor-technology" className="py-20 md:py-28 bg-[#080A0F]">
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.div {...fadeIn} className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 text-xs font-bold tracking-widest uppercase">
              <Radio className="w-3.5 h-3.5" />
              The technology
            </span>
            <h2 className="mt-4 text-3xl md:text-4xl font-display font-bold text-white">
              Physics, learning, and the network edge
            </h2>
            <p className="mt-3 text-white/55 max-w-2xl mx-auto">
              Three layers work together: predict phase transitions before they become jams, coordinate
              fleets to damp shockwaves, and deploy without a hardware refresh cycle.
            </p>
          </motion.div>

          <div className="space-y-4 mb-12">
            {[
              {
                title: "Physics-informed neural networks (PINNs)",
                desc: "Predict traffic phase transitions and surface phantom jams before they fully manifest.",
                icon: Brain,
              },
              {
                title: "Multi-agent reinforcement learning (MARL)",
                desc: "Syncs truck fleets as lead particles, dampening shockwaves to preserve throughput.",
                icon: Network,
              },
              {
                title: "Zero–CapEx edge V2X",
                desc: "Fuses smartphone-class compute with live SPaT APIs to bypass expensive dedicated hardware and scale as pure software.",
                icon: Cpu,
              },
            ].map((row, i) => (
              <motion.div
                key={row.title}
                {...fadeIn}
                transition={{ ...fadeIn.transition, delay: i * 0.06 }}
                className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start p-6 rounded-2xl border border-white/10 bg-[#0B0E14]/80"
              >
                <div className="shrink-0 p-3 rounded-xl bg-white/5 border border-white/10">
                  <row.icon className="w-6 h-6 text-brand-cyan" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-lg">{row.title}</h3>
                  <p className="mt-1 text-white/60 text-sm leading-relaxed">{row.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            {...fadeIn}
            className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#121824] to-[#0A0D14] p-8 md:p-10"
          >
            <h3 className="font-display font-bold text-xl text-white mb-6">Product surface</h3>
            <ul className="grid sm:grid-cols-3 gap-6">
              {[
                {
                  title: "Deterministic speed advisories",
                  desc: "Direct ingestion of Signal Phase and Timing (SPaT) for precise intersection behavior.",
                  icon: Gauge,
                },
                {
                  title: "Green velocity",
                  desc: "Optimal speeds so trucks glide through greens without unnecessary braking.",
                  icon: Target,
                },
                {
                  title: "AI-powered detection",
                  desc: "Real-time highway intelligence via computer vision across camera networks.",
                  icon: Eye,
                },
              ].map((f) => (
                <li key={f.title} className="space-y-2">
                  <div className="flex items-center gap-2 text-brand-orange font-display font-semibold text-sm">
                    <f.icon className="w-4 h-4 shrink-0" />
                    {f.title}
                  </div>
                  <p className="text-sm text-white/55 leading-relaxed">{f.desc}</p>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Business model */}
      <section id="investor-model" className="py-20 md:py-28">
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.div {...fadeIn} className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/10 text-brand-orange border border-brand-orange/25 text-xs font-bold tracking-widest uppercase">
              <DollarSign className="w-3.5 h-3.5" />
              Value proposition
            </span>
            <h2 className="mt-4 text-3xl md:text-4xl font-display font-bold text-white">
              Efficiency as a Service
            </h2>
            <p className="mt-4 inline-block text-2xl md:text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-[#FFB75E]">
              $50 / truck / month
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 mb-10">
            <motion.div
              {...fadeIn}
              className="rounded-2xl border border-white/10 bg-[#0B0E14] p-8 relative overflow-hidden"
            >
              <div className="absolute -top-20 -right-20 w-48 h-48 bg-brand-cyan/10 rounded-full blur-[70px]" />
              <h3 className="font-display font-bold text-white text-lg mb-4 relative">Proven ROI thesis</h3>
              <ul className="space-y-4 text-sm text-white/65 relative">
                <li>
                  <span className="text-brand-cyan font-semibold">Fuel alpha:</span> ~12% fuel reduction
                  through momentum preservation.
                </li>
                <li>
                  <span className="text-brand-cyan font-semibold">Unit economics:</span> ~$600/year software
                  cost per semi vs. ~$8,450/year in savings (~$7,200 fuel + ~$1,250 brake maintenance).
                </li>
                <li>
                  <span className="text-brand-cyan font-semibold">Returns:</span> ~14× ROI for fleets with
                  SaaS-style margins on the software layer.
                </li>
              </ul>
            </motion.div>

            <motion.div
              {...fadeIn}
              transition={{ ...fadeIn.transition, delay: 0.08 }}
              className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#121824] to-[#0A0D14] p-8 flex flex-col justify-center"
            >
              <h3 className="font-display font-bold text-white text-lg mb-4">Initial markets</h3>
              <p className="text-white/60 text-sm leading-relaxed mb-6">
                Deep wedge where speed harmonization and duty cycles compound fastest:
              </p>
              <ul className="space-y-3 text-sm text-white/80">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-orange" />
                  Class 8 trucks
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-orange" />
                  Garbage and vocational fleets
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-orange" />
                  Municipal government vehicles
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Traction */}
      <section id="investor-traction" className="py-20 md:py-28 bg-[#080A0F] border-y border-white/10">
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.div {...fadeIn} className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-white/90 border border-white/10 text-xs font-bold tracking-widest uppercase">
              <Trophy className="w-3.5 h-3.5 text-brand-orange" />
              Traction & validation
            </span>
            <h2 className="mt-4 text-3xl md:text-4xl font-display font-bold text-white">
              Momentum from competition and deployment milestones
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-4 mb-16">
            {[
              "1st place, Draper Data Science Business Plan Competition",
              "1st place, Rice University Goldman Sachs Challenge",
              "1st place, Undergrad Case Competition World Cup (2026)",
            ].map((label, i) => (
              <motion.div
                key={label}
                {...fadeIn}
                transition={{ ...fadeIn.transition, delay: i * 0.06 }}
                className="flex gap-3 items-start p-5 rounded-2xl bg-[#0B0E14] border border-white/10"
              >
                <Trophy className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
                <p className="text-sm text-white/75 leading-snug">{label}</p>
              </motion.div>
            ))}
          </div>

          <motion.div {...fadeIn} className="relative max-w-3xl mx-auto">
            <h3 className="font-display font-bold text-white text-lg mb-8 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-cyan" />
              Roadmap
            </h3>
            <div className="space-y-0 border-l border-white/15 ml-3 pl-8 py-1">
              {[
                {
                  when: "Q2 2026",
                  text: "Launch a 50-truck commercial pilot on the Utah I-80 corridor.",
                },
                {
                  when: "Q3 2026",
                  text: "Secure the “Golden Dataset” and sign first enterprise contracts.",
                },
                {
                  when: "2027",
                  text: "Scale the software layer toward the ~4M Class 8 truck U.S. market.",
                },
              ].map((m, i, arr) => (
                <div key={m.when} className={`relative pb-10 ${i === arr.length - 1 ? "pb-0" : ""}`}>
                  <div className="absolute -left-[37px] top-1.5 w-3 h-3 rounded-full bg-brand-cyan border-4 border-[#080A0F]" />
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-orange mb-1">
                    {m.when}
                  </p>
                  <p className="text-white/70 text-sm leading-relaxed">{m.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* The ask */}
      <section id="investor-ask" className="py-20 md:py-28 pb-32">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <motion.div
            {...fadeIn}
            className="rounded-3xl border border-brand-orange/30 bg-gradient-to-br from-[#1a1510] via-[#0B0E14] to-[#0B0E14] p-10 md:p-14 shadow-[0_0_80px_-20px_rgba(255,140,0,0.35)]"
          >
            <span className="text-xs font-bold tracking-widest uppercase text-brand-cyan">The ask</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-display font-bold text-white">
              Pre-seed: $850K
            </h2>
            <p className="mt-4 text-white/65 leading-relaxed">
              Transition from simulation to live operations and advance to{" "}
              <span className="text-white font-medium">TRL 7</span>. Funding scales cloud infrastructure,
              integrates municipal APIs, and deploys the 50-truck commercial pilot.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 text-xs text-white/50">
              <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5">Cloud & inference</span>
              <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5">Municipal SPaT / data</span>
              <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5">Pilot operations</span>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default InvestorPitchSections;
