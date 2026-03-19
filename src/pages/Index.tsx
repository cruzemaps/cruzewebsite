import Navbar from "@/components/v1/Navbar";
import HeroSection from "@/components/v1/HeroSection";
import ProblemSection from "@/components/v1/ProblemSection";
import SwarmSimulator from "@/components/v1/SwarmSimulator";
import ComparisonSection from "@/components/v1/ComparisonSection";
import BenefitsSection from "@/components/v1/BenefitsSection";
import HowItWorksSection from "@/components/v1/HowItWorksSection";
import TestimonialsSection from "@/components/v1/TestimonialsSection";
import FAQSection from "@/components/v1/FAQSection";
import CTASection from "@/components/v1/CTASection";
import Footer from "@/components/v1/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <HeroSection />
      <SwarmSimulator />
      <ProblemSection />
      <HowItWorksSection />
      <BenefitsSection />
      <ComparisonSection />
      <TestimonialsSection />
      <FAQSection />
      <Footer />
    </div>
  );
};

export default Index;
