import { ArrowRight } from "lucide-react";

export function StickyFooter() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-4">
      <div className="container mx-auto">
        <div className="glass-card p-4 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-gold/20">
          <p className="text-sm md:text-base text-muted-foreground text-center sm:text-left">
            Need <span className="text-foreground font-semibold">specific legal advice</span> for your company?
          </p>
          <a
            href="https://www.dcorpo.legal"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold group flex items-center gap-2 whitespace-nowrap"
          >
            Visit dCorpo Legal Firm
            <ArrowRight className="w-4 h-4 group-hover:animate-arrow-bounce" />
          </a>
        </div>
      </div>
    </div>
  );
}
