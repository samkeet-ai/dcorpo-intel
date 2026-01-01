import { useState } from "react";
import { Briefcase, X, ExternalLink, Calendar } from "lucide-react";

export function BusinessConnect() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-24 right-4 z-50 sm:bottom-28">
      {/* Speed Dial Options - Expand upward */}
      <div
        className={`absolute bottom-16 right-0 flex flex-col gap-3 transition-all duration-300 ${
          isOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {/* Book Consultation */}
        <a
          href="https://www.dcorpo.legal/map"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-xl shadow-lg hover:bg-secondary transition-colors group whitespace-nowrap"
        >
          <div className="p-2 rounded-lg bg-primary/10">
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground">Book Consultation</span>
        </a>

        {/* Visit dCorpo Legal */}
        <a
          href="https://www.dcorpo.legal"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-xl shadow-lg hover:bg-secondary transition-colors group whitespace-nowrap"
        >
          <div className="p-2 rounded-lg bg-gold/10">
            <ExternalLink className="w-4 h-4 text-gold" />
          </div>
          <span className="text-sm font-medium text-foreground">Visit dCorpo Legal</span>
        </a>
      </div>

      {/* Main Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${
          isOpen
            ? "bg-secondary rotate-45"
            : "bg-gradient-to-br from-gold to-gold/80 hover:shadow-gold"
        }`}
        aria-label={isOpen ? "Close menu" : "Connect with dCorpo Legal"}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-foreground" />
        ) : (
          <>
            <Briefcase className="w-6 h-6 text-gold-foreground" />
            {/* Pulse animation */}
            <span className="absolute inset-0 rounded-full bg-gold/50 animate-ping opacity-30" />
          </>
        )}
      </button>
    </div>
  );
}
