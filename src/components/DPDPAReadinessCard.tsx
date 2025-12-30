import { Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DPDPAReadinessCard() {
  const handleStartAssessment = () => {
    window.location.href = "#assessment-tool";
  };

  return (
    <div 
      className="glass-card hover-lift col-span-1 lg:col-span-2 p-6 md:p-8 animate-slide-up flex flex-col justify-between min-h-[220px]"
      style={{ 
        animationDelay: "0.5s",
        background: "linear-gradient(135deg, hsl(210 100% 15% / 0.8), hsl(220 80% 20% / 0.6))"
      }}
    >
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-primary/30">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold uppercase tracking-wide">
            Free Tool
          </span>
        </div>
        
        <h2 className="text-2xl md:text-3xl font-bold mb-2">
          Are you DPDPA Ready?
        </h2>
        <p className="text-muted-foreground text-base md:text-lg mb-6">
          Take our Free Gap Assessment to find out your compliance score.
        </p>
      </div>

      <Button
        size="lg"
        onClick={handleStartAssessment}
        className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base md:text-lg px-8 py-6 group"
      >
        Start Assessment
        <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
      </Button>
    </div>
  );
}
