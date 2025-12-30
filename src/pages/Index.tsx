import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { BentoGrid } from "@/components/BentoGrid";
import { StickyFooter } from "@/components/StickyFooter";
import { Footer } from "@/components/Footer";
import { useWeeklyBrief } from "@/hooks/useWeeklyBrief";

const Index = () => {
  const { data: brief, isLoading } = useWeeklyBrief();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        <HeroSection brief={brief ?? null} isLoading={isLoading} />
        <BentoGrid brief={brief ?? null} isLoading={isLoading} />
      </main>

      <Footer />
      <StickyFooter />
    </div>
  );
};

export default Index;
