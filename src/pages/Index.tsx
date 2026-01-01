import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { BentoGrid } from "@/components/BentoGrid";
import { LegalBriefsGrid } from "@/components/LegalBriefsGrid";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { Footer } from "@/components/Footer";
import { CookieConsent } from "@/components/CookieConsent";
import { BusinessConnect } from "@/components/BusinessConnect";
import { useWeeklyBrief } from "@/hooks/useWeeklyBrief";

const Index = () => {
  const { data: brief, isLoading } = useWeeklyBrief();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        <HeroSection brief={brief ?? null} isLoading={isLoading} />
        <BentoGrid brief={brief ?? null} isLoading={isLoading} />
        <LegalBriefsGrid />
        <NewsletterSignup />
      </main>

      <Footer />
      <BusinessConnect />
      <CookieConsent />
    </div>
  );
};

export default Index;
