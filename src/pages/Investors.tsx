import React from "react";
import NavbarV2 from "@/components/v2/NavbarV2";
import InteractiveLabV2 from "@/components/v2/InteractiveLabV2";
import InvestorPitchSections from "@/components/v2/InvestorPitchSections";

const Investors = () => {
  return (
    <div className="min-h-screen bg-brand-charcoal text-white font-body selection:bg-brand-cyan/30">
      <NavbarV2 />

      <section className="pt-28 pb-10 md:pt-32 md:pb-12 border-b border-white/5">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <p className="text-xs font-bold tracking-widest uppercase text-brand-orange mb-3">
            Investor briefing
          </p>
          <h1 className="font-display font-bold text-4xl md:text-5xl text-white tracking-tight">
            Cruze{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-[#FFB75E]">
              Navigate Smarter
            </span>
          </h1>
          <p className="mt-4 text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
            Interact with the live corridor feed, then review the technology, unit economics, and
            deployment path below.
          </p>
        </div>
      </section>

      <InteractiveLabV2 />
      <InvestorPitchSections />
    </div>
  );
};

export default Investors;
