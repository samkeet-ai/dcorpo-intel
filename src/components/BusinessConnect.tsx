import { useState } from "react";
import { MessageCircle, X, ExternalLink, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BusinessConnect() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-20 right-4 z-40">
      {/* Expanded Panel */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 glass-card p-6 border border-gold/30 shadow-lg animate-scale-in mb-4">
          {/* Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-gold/70 flex items-center justify-center">
                <span className="text-gold-foreground font-bold text-sm">dC</span>
              </div>
              <span className="text-gradient-gold font-bold">dCorpo Legal</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Expert legal counsel for the digital age
            </p>
          </div>

          {/* Content */}
          <div className="space-y-3 mb-6">
            <div className="p-3 rounded-lg bg-secondary/50">
              <p className="text-sm font-medium">Need expert advice?</p>
              <p className="text-xs text-muted-foreground mt-1">
                Our specialists help navigate complex regulatory landscapes including DPDPA, GDPR, and AI governance.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              asChild
              className="w-full btn-gold"
            >
              <a
                href="https://www.dcorpo.legal"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                Visit dCorpo Legal
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>

            <Button
              asChild
              variant="outline"
              className="w-full btn-gold-outline"
            >
              <a
                href="https://www.dcorpo.legal/book"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Book Consultation
              </a>
            </Button>
          </div>

          {/* Footer */}
          <p className="text-xs text-center text-muted-foreground mt-4">
            Trusted by 500+ enterprises
          </p>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative w-14 h-14 rounded-full shadow-lg transition-all duration-300 ${
          isOpen 
            ? "bg-secondary" 
            : "bg-gradient-to-br from-gold to-gold/80 hover:shadow-gold"
        }`}
        aria-label="Connect with dCorpo Legal"
      >
        {isOpen ? (
          <X className="w-6 h-6 mx-auto text-foreground" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6 mx-auto text-gold-foreground" />
            {/* Pulse animation */}
            <span className="absolute inset-0 rounded-full bg-gold/50 animate-ping opacity-30" />
          </>
        )}
      </button>

      {/* Tooltip on hover */}
      {!isOpen && (
        <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-popover text-popover-foreground text-sm px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
            Connect with dCorpo Legal
          </div>
        </div>
      )}
    </div>
  );
}
