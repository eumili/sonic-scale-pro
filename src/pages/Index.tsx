import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import DailyAuditSection from '@/components/landing/DailyAuditSection';
import AIRecommendationsSection from '@/components/landing/AIRecommendationsSection';
import MultiPlatformSection from '@/components/landing/MultiPlatformSection';
import PricingTableSection from '@/components/landing/PricingTableSection';
import ProblemSection from '@/components/landing/ProblemSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import FAQSection from '@/components/landing/FAQSection';
import PricingCTASection from '@/components/landing/PricingCTASection';
import Footer from '@/components/landing/Footer';

export default function Index() {
  return (
    <div className="min-h-screen bg-background dark">
      <Navbar />
      <HeroSection />
      <DailyAuditSection />
      <AIRecommendationsSection />
      <MultiPlatformSection />
      <PricingTableSection />
      <ProblemSection />
      <HowItWorksSection />
      <FeaturesSection />
      <TestimonialsSection />
      <PricingCTASection />
      <FAQSection />
      <Footer />
    </div>
  );
}
