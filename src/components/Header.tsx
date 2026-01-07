import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ExternalLink, Menu, X, Archive, Home } from "lucide-react";
import { useCountdown } from "@/hooks/useCountdown";
import { ModeToggle } from "@/components/ModeToggle";

export function Header() {
  const countdown = useCountdown();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const formatNumber = (num: number) => num.toString().padStart(2, "0");

  const navItems = [
    { to: "/", label: "Home", icon: Home },
    { to: "/archive", label: "Memory Lane", icon: Archive },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">d</span>
          </div>
          <span className="font-bold text-xl tracking-tight">
            dCorpo<span className="text-primary">.Intel</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                isActive(item.to)
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Countdown - Hidden on mobile */}
          <div className="hidden lg:flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Next Briefing:</span>
            <div className="flex items-center gap-1 font-mono font-semibold text-accent">
              <span className="bg-secondary px-2 py-1 rounded">{formatNumber(countdown.days)}d</span>
              <span>:</span>
              <span className="bg-secondary px-2 py-1 rounded">{formatNumber(countdown.hours)}h</span>
              <span>:</span>
              <span className="bg-secondary px-2 py-1 rounded">{formatNumber(countdown.minutes)}m</span>
            </div>
          </div>

          {/* Theme Toggle */}
          <ModeToggle />

          {/* CTA Button */}
          <a
            href="https://www.dcorpo.legal"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold-outline hidden sm:flex items-center gap-2 text-sm"
          >
            <span className="hidden md:inline">Get Professional Help</span>
            <span className="md:hidden">Consult</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-lg">
          <div className="container mx-auto px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.to)
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-secondary text-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
            <a
              href="https://www.dcorpo.legal"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-lg btn-gold-outline w-full justify-center mt-4"
            >
              Get Professional Help
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
