import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Shield, Cookie } from "lucide-react";

const COOKIE_CONSENT_KEY = "legal_eagle_cookie_consent";

type ConsentLevel = "none" | "necessary" | "all";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [consentLevel, setConsentLevel] = useState<ConsentLevel>("none");

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (stored) {
      setConsentLevel(stored as ConsentLevel);
    } else {
      // Show banner after a short delay
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleConsent = (level: ConsentLevel) => {
    setConsentLevel(level);
    localStorage.setItem(COOKIE_CONSENT_KEY, level);
    setVisible(false);

    // Only load analytics if user accepts all
    if (level === "all") {
      // Analytics scripts would be loaded here
      console.log("Analytics consent granted");
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <div className="container mx-auto">
        <div className="glass-card p-6 border border-border/50 shadow-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Cookie className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-accent" />
                  DPDPA Compliant Cookies
                </h3>
                <p className="text-sm text-muted-foreground">
                  We use cookies to ensure security and analyze traffic as per DPDPA guidelines. 
                  You can choose which cookies to accept.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Button
                variant="outline"
                onClick={() => handleConsent("necessary")}
                className="border-border hover:bg-secondary"
              >
                Accept Necessary Only
              </Button>
              <Button
                onClick={() => handleConsent("all")}
                className="btn-gold"
              >
                Accept All
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            By continuing to use this site, you agree to our{" "}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>
            {" "}in accordance with the Digital Personal Data Protection Act, 2023.
          </p>
        </div>
      </div>
    </div>
  );
}

// Hook to check consent level
export function useCookieConsent(): ConsentLevel {
  const [consent, setConsent] = useState<ConsentLevel>("none");

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (stored) {
      setConsent(stored as ConsentLevel);
    }
  }, []);

  return consent;
}
