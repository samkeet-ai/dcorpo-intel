import { useEffect, useRef, useState } from "react";
import { BookOpen, Lightbulb, Globe, HelpCircle } from "lucide-react";
import { WeeklyBrief } from "@/hooks/useWeeklyBrief";
import confetti from "canvas-confetti";
import { RiskEstimator } from "@/components/RiskEstimator";
import { GlobalHeatmap } from "@/components/GlobalHeatmap";

interface BentoGridProps {
  brief: WeeklyBrief | null;
  isLoading: boolean;
}

function DeepDiveTile({ text }: { text: string }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const progress = scrollTop / (scrollHeight - clientHeight);
      setScrollProgress(Math.min(progress * 100, 100));

      if (progress >= 0.95 && !hasCompleted) {
        setHasCompleted(true);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#2563EB", "#10B981", "#D4AF37"],
        });
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasCompleted]);

  const formatText = (text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("**") && line.endsWith("**")) {
        return (
          <h3 key={i} className="text-lg font-bold text-foreground mt-6 mb-2">
            {line.replace(/\*\*/g, "")}
          </h3>
        );
      }
      if (line.startsWith("- ")) {
        return (
          <li key={i} className="ml-4 text-muted-foreground">
            {line.substring(2)}
          </li>
        );
      }
      if (line.match(/^\d+\./)) {
        return (
          <li key={i} className="ml-4 text-muted-foreground list-decimal">
            {line.substring(3)}
          </li>
        );
      }
      if (line.trim() === "") return <br key={i} />;
      return (
        <p key={i} className="text-muted-foreground leading-relaxed">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="glass-card hover-lift col-span-1 lg:col-span-2 row-span-1 lg:row-span-2 flex flex-col h-[400px] lg:h-[500px] animate-slide-up" style={{ animationDelay: "0.1s" }}>
      <div className="p-6 border-b border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold">Deep Dive Analysis</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Legal IQ</span>
          <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="scroll-progress"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>
          <span className="font-mono text-primary">{Math.round(scrollProgress)}%</span>
        </div>
      </div>

      <div ref={contentRef} className="flex-1 overflow-y-auto p-6 space-y-2 scrollbar-thin">
        {formatText(text)}
      </div>

      {hasCompleted && (
        <div className="p-4 border-t border-border/50 text-center">
          <span className="text-accent font-semibold">🎉 Briefing Complete! You're now 100% caught up.</span>
        </div>
      )}
    </div>
  );
}

function FunFactTile({ fact }: { fact: string }) {
  return (
    <div 
      className="glass-card hover-lift col-span-1 flex flex-col justify-center p-6 min-h-[200px] animate-slide-up"
      style={{ 
        animationDelay: "0.2s",
        background: "linear-gradient(135deg, hsl(280 70% 20% / 0.5), hsl(320 80% 25% / 0.5))"
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-foreground/10">
          <Lightbulb className="w-5 h-5 text-gold" />
        </div>
        <h2 className="text-lg font-bold">Did You Know?</h2>
      </div>
      <p className="text-xl md:text-2xl font-bold leading-snug">{fact}</p>
    </div>
  );
}

function RadarTile({ points }: { points: string[] }) {
  return (
    <div className="glass-card hover-lift col-span-1 p-6 animate-slide-up" style={{ animationDelay: "0.3s" }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-accent/20">
          <Globe className="w-5 h-5 text-accent" />
        </div>
        <h2 className="text-lg font-bold">Global Radar</h2>
      </div>
      <ul className="space-y-3">
        {points.slice(0, 3).map((point, index) => (
          <li
            key={index}
            className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <span className="text-xl shrink-0">{point.substring(0, 2)}</span>
            <span className="text-sm text-muted-foreground">{point.substring(3)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function JargonTile({ term, definition }: { term: string; definition: string }) {
  return (
    <div className="glass-card hover-lift p-6 animate-slide-up" style={{ animationDelay: "0.4s" }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-gold/20">
          <HelpCircle className="w-5 h-5 text-gold" />
        </div>
        <h2 className="text-lg font-bold">Jargon Buster</h2>
      </div>
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-gradient-gold">{term}</h3>
        <p className="text-muted-foreground leading-relaxed">{definition}</p>
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <section id="content" className="py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="skeleton col-span-1 lg:col-span-2 lg:row-span-2 h-[400px] lg:h-[500px] rounded-xl" />
          <div className="skeleton col-span-1 h-[200px] rounded-xl" />
          <div className="skeleton col-span-1 h-[200px] rounded-xl" />
          <div className="skeleton col-span-1 h-[200px] rounded-xl" />
          <div className="skeleton col-span-1 h-[200px] rounded-xl" />
        </div>
      </div>
    </section>
  );
}

export function BentoGrid({ brief, isLoading }: BentoGridProps) {
  if (isLoading) return <SkeletonGrid />;
  if (!brief) return null;

  return (
    <section id="content" className="py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Deep Dive - 2x2 on desktop, full width on mobile */}
          {brief.deep_dive_text && (
            <DeepDiveTile text={brief.deep_dive_text} />
          )}

          {/* Fun Fact */}
          {brief.fun_fact && <FunFactTile fact={brief.fun_fact} />}

          {/* Global Radar */}
          {brief.radar_points && brief.radar_points.length > 0 && (
            <RadarTile points={brief.radar_points} />
          )}

          {/* Jargon Buster */}
          {brief.jargon_term && brief.jargon_def && (
            <JargonTile term={brief.jargon_term} definition={brief.jargon_def} />
          )}

          {/* Risk Estimator */}
          <RiskEstimator />

          {/* Global Heatmap */}
          <GlobalHeatmap />
        </div>
      </div>
    </section>
  );
}
