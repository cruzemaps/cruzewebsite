import React from "react";
import NavbarV2 from "@/components/v2/NavbarV2";
import HeroSectionV2 from "@/components/v2/HeroSectionV2";
import SegmentSolutionsV2 from "@/components/v2/SegmentSolutionsV2";
import CruzeLab from "@/components/v2/CruzeLab";
import HowItWorksV2 from "@/components/v2/HowItWorksV2";
import ComparisonV2 from "@/components/v2/ComparisonV2";
import ImpactMapV2 from "@/components/v2/ImpactMapV2";
import FinalConversionV2 from "@/components/v2/FinalConversionV2";

const V2 = () => {
  return (
    <div className="min-h-screen bg-brand-charcoal text-white font-body selection:bg-brand-cyan/30">
      <NavbarV2 />
      <HeroSectionV2 />
      <SegmentSolutionsV2 />
      <CruzeLab />
      <HowItWorksV2 />
      <ComparisonV2 />
      <ImpactMapV2 />
      <FinalConversionV2 />
    </div>
  );
};

export default V2;
