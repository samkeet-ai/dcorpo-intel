import { Linkedin, ArrowDown } from "lucide-react";
import { format } from "date-fns";
import { WeeklyBrief } from "@/hooks/useWeeklyBrief";
import { toast } from "sonner";

interface HeroSectionProps {
  brief: WeeklyBrief | null;
  isLoading: boolean;
}


function SkeletonHero() {
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto w-full">
        <div className="relative rounded-2xl overflow-hidden glass-card">
          <div className="skeleton h-[500px] w-full" />
          <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
            <div className="skeleton h-6 w-32 mb-4 rounded" />
            <div className="skeleton h-12 w-3/4 mb-4 rounded" />
            <div className="skeleton h-6 w-1/2 mb-8 rounded" />
            <div className="flex gap-4">
              <div className="skeleton h-12 w-32 rounded-lg" />
              <div className="skeleton h-12 w-40 rounded-lg" />
              <div className="skeleton h-12 w-12 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HeroSection({ brief, isLoading }: HeroSectionProps) {
  if (isLoading) return <SkeletonHero />;
  if (!brief) return null;

  const handleShare = () => {
    const shareText = `📋 ${brief.title}\n\nCheck out the latest legal briefing from dCorpo Intel!\n\n#LegalTech #Compliance #DPDPA`;
    navigator.clipboard.writeText(shareText);
    toast.success("Summary copied to clipboard!", {
      description: "Ready to share on LinkedIn",
    });
  };

  const scrollToContent = () => {
    document.getElementById("content")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto w-full">
        <div className="relative rounded-2xl overflow-hidden glass-card hover-lift animate-fade-in">
          {/* Cover Image */}
          <div className="relative h-[500px] w-full">
            <img
              src={brief.cover_image || "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&h=600&fit=crop"}
              alt={brief.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          </div>

          {/* Content Overlay */}
          <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
            {/* Badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-accent/20 text-accent text-sm font-medium border border-accent/30 animate-pulse-glow">
                🔴 LIVE
              </span>
              <span className="text-muted-foreground text-sm">
                {format(new Date(brief.publish_date), "MMMM d, yyyy")}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight max-w-4xl">
              {brief.title}
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
              Your weekly intelligence briefing on legal and regulatory developments that matter.
            </p>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={scrollToContent}
                className="btn-primary-gradient flex items-center gap-2"
              >
                Read Brief
                <ArrowDown className="w-4 h-4" />
              </button>

              <button
                onClick={handleShare}
                className="p-3 rounded-lg bg-[#0A66C2] hover:bg-[#0A66C2]/80 transition-colors"
                aria-label="Share on LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
