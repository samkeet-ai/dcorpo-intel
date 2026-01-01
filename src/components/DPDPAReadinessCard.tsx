import { Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DPDPAReadinessCard() {
  const handleStartAssessment = () => {
    window.location.href = "#assessment-tool";
  };

  return (
    <div 
      className="glass-card hover-lift p-6 h-full animate-slide-up flex flex-col justify-between"
      style={{ 
        animationDelay: "0.5s",
        background: "linear-gradient(135deg, hsl(210 100% 15% / 0.8), hsl(220 80% 20% / 0.6))"
      }}
    >
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-primary/30">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <span className="px-2.5 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold uppercase tracking-wide">
            Free Tool
          </span>
        </div>
        
        <h2 className="text-xl font-bold mb-2">
          Are you DPDPA Ready?
        </h2>
        <p className="text-muted-foreground text-sm mb-4">
          Take our Free Gap Assessment to find out your compliance score.
        </p>
      </div>

      <Button
        size="sm"
        onClick={handleStartAssessment}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold group"
      >
        Start Assessment
        <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
      </Button>
    </div>
  );
}
