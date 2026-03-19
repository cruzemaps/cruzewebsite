import { Button } from "@/components/ui/button";
import { ArrowRight, Star } from "lucide-react";

const FinalConversionV2 = () => {
  return (
    <section className="py-32 bg-brand-charcoal relative overflow-hidden">
      
      {/* Background Gradients */}
      <div className="absolute inset-0 flex justify-center opacity-30 pointer-events-none">
        <div className="absolute -top-[20%] w-[80%] h-[80%] bg-brand-orange blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl flex flex-col items-center">
        
        <h2 className="text-5xl md:text-7xl font-display font-bold text-white mb-8 leading-tight">
          Ready to recover your <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-[#FFB75E]">
             lost hours?
          </span>
        </h2>

        {/* Re-iterated Testimonial / Proof */}
        <div className="bg-black/40 border border-white/10 p-8 rounded-3xl backdrop-blur-md mb-12 max-w-2xl mx-auto shadow-2xl">
           <div className="flex justify-center gap-1 mb-6 text-brand-orange">
             {[...Array(5)].map((_, i) => <Star key={i} className="fill-current w-5 h-5" />)}
           </div>
           <p className="text-xl md:text-2xl text-white/90 font-serif leading-relaxed mb-6 italic">
             "Cruze completely changed how we dispatch. Our drivers spend less time braking and more time earning. It paid for itself in week two."
           </p>
           <div className="flex flex-col items-center">
             <div className="font-bold text-white">Sarah Johnson</div>
             <div className="text-sm text-white/50 mb-4">Operations Director, TX Freight</div>
             <a href="#" className="text-sm font-bold text-brand-cyan hover:underline uppercase tracking-wider">Read the Case Study &rarr;</a>
           </div>
        </div>

        {/* Huge CTA */}
        <Button size="lg" className="bg-brand-orange hover:bg-brand-orange/90 text-[#0B0E14] rounded-full font-bold text-xl px-12 py-8 flex items-center gap-3 group tracking-wide shadow-[0_0_40px_rgba(255,140,0,0.4)] hover:shadow-[0_0_60px_rgba(255,140,0,0.6)] transition-all transform hover:scale-105">
          Start Your Pilot Program
          <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
        </Button>
        <p className="mt-6 text-sm text-white/40 font-mono">No hardware required. Deploys in 48 hours.</p>
        
      </div>
    </section>
  );
};

export default FinalConversionV2;
