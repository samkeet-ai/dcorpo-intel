import { useState } from "react";
import { Mail, Loader2, CheckCircle, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string()
  .trim()
  .email("Please enter a valid email address")
  .max(255, "Email too long")
  .transform(val => val.toLowerCase());

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate consent
    if (!consent) {
      toast.error("Please accept the consent to subscribe", {
        description: "We need your consent to send you legal updates.",
      });
      return;
    }

    // Validate email
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("subscribers")
        .insert({ 
          email: result.data,
          consent_log: true,
          status: "active"
        });

      if (error) {
        if (error.code === "23505") {
          toast.info("You're already subscribed!", {
            description: "We'll keep you updated with the latest legal intel.",
          });
          setIsSubscribed(true);
        } else {
          throw error;
        }
      } else {
        toast.success("Welcome aboard!", {
          description: "You'll receive our curated legal intelligence.",
        });
        setIsSubscribed(true);
        setEmail("");
      }
    } catch (error: any) {
      console.error("Subscription error:", error);
      toast.error("Failed to subscribe", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-16 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-gold/10" />
      
      <div className="container mx-auto px-4 relative">
        <div className="glass-card p-8 md:p-12 max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
            {isSubscribed ? (
              <CheckCircle className="w-8 h-8 text-accent" />
            ) : (
              <Mail className="w-8 h-8 text-primary" />
            )}
          </div>

          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Get the Legal <span className="text-gradient-gold">Intel</span> Weekly
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Stay informed with curated insights on regulatory changes, compliance updates, and legal tech trends delivered to your inbox.
          </p>

          {isSubscribed ? (
            <div className="p-4 rounded-lg bg-accent/20 border border-accent/30">
              <p className="text-accent font-medium">
                ✓ You're on the list! Watch your inbox for our next intel briefing.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 h-12 bg-secondary border-border"
                  required
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  className="btn-gold h-12 px-8"
                  disabled={isLoading || !consent}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              </div>

              {/* DPDPA Consent Checkbox */}
              <div className="flex items-start space-x-3 text-left">
                <Checkbox
                  id="consent"
                  checked={consent}
                  onCheckedChange={(checked) => setConsent(checked === true)}
                  className="mt-1"
                />
                <Label htmlFor="consent" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                  <Shield className="w-4 h-4 inline mr-1 text-accent" />
                  I consent to receive legal updates from The Legal Eagle Intel. 
                  I understand I can unsubscribe at any time. 
                  <span className="text-accent">*</span>
                </Label>
              </div>
            </form>
          )}

          <p className="text-xs text-muted-foreground mt-4">
            🔒 DPDPA Compliant • No spam • Unsubscribe anytime
          </p>
        </div>
      </div>
    </section>
  );
}
