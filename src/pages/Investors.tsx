import React from "react";
import NavbarV2 from "@/components/v2/NavbarV2";
import InteractiveLabV2 from "@/components/v2/InteractiveLabV2";

const Investors = () => {
  return (
    <div className="min-h-screen bg-brand-charcoal text-white font-body selection:bg-brand-cyan/30">
      <NavbarV2 />
      <InteractiveLabV2 />
    </div>
  );
};

export default Investors;
