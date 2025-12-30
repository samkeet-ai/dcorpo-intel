import { Sun, Moon, ExternalLink } from "lucide-react";
import { useCountdown } from "@/hooks/useCountdown";
import { useState, useEffect } from "react";

export function Header() {
  const countdown = useCountdown();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle("light", !isDark);
  }, [isDark]);

  const formatNumber = (num: number) => num.toString().padStart(2, "0");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">d</span>
          </div>
          <span className="font-bold text-xl tracking-tight">
            dCorpo<span className="text-primary">.Intel</span>
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4 md:gap-6">
          {/* Countdown */}
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Next Briefing In:</span>
            <div className="flex items-center gap-1 font-mono font-semibold text-accent">
              <span className="bg-secondary px-2 py-1 rounded">{formatNumber(countdown.days)}d</span>
              <span>:</span>
              <span className="bg-secondary px-2 py-1 rounded">{formatNumber(countdown.hours)}h</span>
              <span>:</span>
              <span className="bg-secondary px-2 py-1 rounded">{formatNumber(countdown.minutes)}m</span>
              <span>:</span>
              <span className="bg-secondary px-2 py-1 rounded animate-pulse">{formatNumber(countdown.seconds)}s</span>
            </div>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-gold" />
            ) : (
              <Moon className="w-5 h-5 text-primary" />
            )}
          </button>

          {/* CTA Button */}
          <a
            href="https://www.dcorpo.legal"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold-outline flex items-center gap-2 text-sm"
          >
            <span className="hidden md:inline">Get Professional Help</span>
            <span className="md:hidden">Consult</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
