import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProblemSection from "@/components/ProblemSection";
import TechnologySection from "@/components/TechnologySection";
import BenefitsSection from "@/components/BenefitsSection";
import ComparisonSection from "@/components/ComparisonSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <TechnologySection />
      <BenefitsSection />
      <ComparisonSection />
      <HowItWorksSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
