import React from "react";
import NavbarV2 from "@/components/v2/NavbarV2";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { TrendingUp, Globe, Shield, Zap, ChevronRight } from "lucide-react";

const Investors = () => {
  return (
    <div className="min-h-screen bg-brand-charcoal text-white font-body selection:bg-brand-orange/30">
      <NavbarV2 />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-glow opacity-50 pointer-events-none" />
        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <span className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold tracking-wider text-brand-orange uppercase bg-brand-orange/10 border border-brand-orange/20 rounded-full">
              Investor Relations
            </span>
            <h1 className="text-5xl md:text-7xl font-display font-bold mb-8 leading-tight">
              Pioneering the Future of <span className="text-gradient">Autonomous Swarm</span> Intelligence
            </h1>
            <p className="text-xl text-white/60 mb-10 leading-relaxed max-w-2xl mx-auto">
              Cruze is building the foundational navigation layer for the next generation of logistics, transit, and autonomous mobility.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-brand-orange hover:bg-brand-orange/90 text-brand-charcoal font-bold rounded-full px-8 h-14">
                Request Pitch Deck <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="border-white/10 hover:bg-white/5 text-white rounded-full px-8 h-14">
                View Vision Paper
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Key Metrics / Highlights */}
      <section className="py-24 border-y border-white/5 bg-white/[0.02]">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { 
                icon: <TrendingUp className="w-8 h-8 text-brand-orange" />,
                title: "Scalable Growth",
                desc: "Targeting a $2.5T global logistics market with a software-first approach to swarm optimization."
              },
              { 
                icon: <Globe className="w-8 h-8 text-brand-orange" />,
                title: "Global Infrastructure",
                desc: "Patent-pending V2X protocols designed for seamless integration with existing urban infrastructure."
              },
              { 
                icon: <Shield className="w-8 h-8 text-brand-orange" />,
                title: "Safety Proven",
                desc: "0.001% collision probability in high-density swarm simulations across 1M+ simulated miles."
              }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-brand-orange/20 transition-all duration-300"
              >
                <div className="mb-6">{item.icon}</div>
                <h3 className="text-2xl font-display font-bold mb-4">{item.title}</h3>
                <p className="text-white/50 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision Statement */}
      <section className="py-32">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto bg-gradient-card rounded-[3rem] p-12 md:p-20 relative overflow-hidden border border-white/10">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-orange/10 blur-[100px]" />
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-16">
              <div className="flex-1">
                <h2 className="text-4xl md:text-5xl font-display font-bold mb-8">Our Mission</h2>
                <div className="space-y-6 text-xl text-white/70 leading-relaxed italic font-serif">
                  <p>
                    "We believe that the future of movement isn't just about individual vehicles getting smarter—it's about the collective intelligence of the swarm."
                  </p>
                  <p>
                    "By enabling vehicles to communicate and coordinate in real-time, we're not just solving traffic; we're redefining wait-times, fuel efficiency, and urban life as we know it."
                  </p>
                </div>
              </div>
              <div className="w-full md:w-1/3 flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-brand-orange blur-3xl opacity-20 animate-pulse-glow" />
                  <img src="/logo.png" alt="Cruze Logo" className="w-48 h-48 relative z-10" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-12">Interested in learning more?</h2>
          <Button size="lg" onClick={() => window.location.href='mailto:cruzemaps@gmail.com'} className="bg-brand-orange hover:bg-brand-orange/90 text-brand-charcoal font-bold rounded-full px-12 h-16 text-lg">
            Contact Investor Relations
          </Button>
        </div>
      </section>

      {/* Footer Placeholder matching V2 style */}
      <footer className="py-20 border-t border-white/5 opacity-50">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm">© 2026 Cruze Maps. All rights reserved for current and future partners.</p>
        </div>
      </footer>
    </div>
  );
};

export default Investors;
