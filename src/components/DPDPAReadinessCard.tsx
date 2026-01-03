import { Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DPDPAReadinessCard() {
  const handleStartAssessment = () => {
    window.location.href = "#assessment-tool";
  };

  return (
    <div 
      className="glass-card hover-lift p-4 h-full overflow-hidden animate-slide-up flex flex-col"
      style={{ 
        animationDelay: "0.5s",
        background: "linear-gradient(135deg, hsl(210 100% 15% / 0.8), hsl(220 80% 20% / 0.6))"
      }}
    >
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <div className="p-2 rounded-lg bg-primary/30">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-semibold uppercase tracking-wide">
          Free Tool
        </span>
      </div>
      
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
        <h2 className="text-lg font-bold mb-1">
          Are you DPDPA Ready?
        </h2>
        <p className="text-muted-foreground text-sm mb-3">
          Take our Free Gap Assessment to find out your compliance score.
        </p>
      </div>

      <Button
        size="sm"
        onClick={handleStartAssessment}
        className="w-full shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold group"
      >
        Start Assessment
        <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
      </Button>
    </div>
  );
}
