import Navbar from "@/components/v1/Navbar";
import HeroSection from "@/components/v1/HeroSection";
import TrustedBySection from "@/components/TrustedBySection";
import SwarmSimulator from "@/components/v1/SwarmSimulator";
import SavingsCalculator from "@/components/SavingsCalculator";
import ProblemSection from "@/components/v1/ProblemSection";
import HowItWorksSection from "@/components/v1/HowItWorksSection";
import BenefitsSection from "@/components/v1/BenefitsSection";
import SafetySection from "@/components/SafetySection";
import RewardsSection from "@/components/RewardsSection";
import ComparisonSection from "@/components/v1/ComparisonSection";
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
      <SafetySection />
      <RewardsSection />
      <ComparisonSection />
      <TestimonialsSection />
      <FAQSection />
      <Footer />
    </div>
  );
};

export default Index;
