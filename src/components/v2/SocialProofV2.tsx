import React from "react";

const SocialProofV2 = () => {
  const logos = [
    { name: "Transport Solutions Inc", icon: "🏢" },
    { name: "Dr. Chen Consulting", icon: "📊" },
    { name: "Global Logistics", icon: "🌍" },
    { name: "Metro Transit Auth", icon: "🚌" },
    { name: "Fortune 500 Retailer", icon: "🛒" },
  ];

  return (
    <section className="py-12 border-b border-white/10 bg-brand-charcoal overflow-hidden">
      <div className="container mx-auto px-6">
        <p className="text-center text-sm font-medium text-white/50 tracking-wider uppercase mb-8">
          Powering the next generation of logistics for:
        </p>
        
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
          {logos.map((logo, index) => (
            <div key={index} className="flex items-center gap-2 group cursor-pointer transition-transform hover:scale-105">
              <span className="text-2xl group-hover:text-brand-orange transition-colors">{logo.icon}</span>
              <span className="font-display font-bold text-lg text-white/80 group-hover:text-white transition-colors">
                {logo.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProofV2;
