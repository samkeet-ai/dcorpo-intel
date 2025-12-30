import { useState } from "react";
import { LogOut, Sparkles, FileText, Clock, CheckCircle, Calendar } from "lucide-react";
import { AdminAuthProvider, useAdminAuth } from "@/contexts/AdminAuthContext";
import { PinLogin } from "@/components/admin/PinLogin";
import { BriefEditor } from "@/components/admin/BriefEditor";
import { useDraftBriefs, useAdminBriefs, useScheduledBriefs, AdminBrief } from "@/hooks/useAdminBriefs";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { toast } from "sonner";

function AdminDashboard() {
  const { logout } = useAdminAuth();
  const [selectedBrief, setSelectedBrief] = useState<AdminBrief | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { data: drafts, isLoading: draftsLoading } = useDraftBriefs();
  const { data: scheduled, isLoading: scheduledLoading } = useScheduledBriefs();
  const { data: allBriefs } = useAdminBriefs();

  const handleGenerate = () => {
    setIsGenerating(true);
    toast.info("Connecting to AI Brain...", {
      description: "This feature will generate content using AI.",
    });
    
    // Simulate loading for demo
    setTimeout(() => {
      setIsGenerating(false);
      toast.success("AI generation ready!", {
        description: "Connect to the edge function for full functionality.",
      });
    }, 2000);
  };

  if (selectedBrief) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <BriefEditor
            brief={selectedBrief}
            onBack={() => setSelectedBrief(null)}
          />
        </div>
      </div>
    );
  }

  const activeBriefs = allBriefs?.filter((b) => b.status === "active") || [];
  const draftBriefs = drafts || [];
  const scheduledBriefs = scheduled || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">d</span>
            </div>
            <span className="font-bold text-xl">The Newsroom</span>
          </div>
          <Button variant="ghost" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
        {/* Generate Button */}
        <div className="glass-card p-6 md:p-8 text-center">
          <Sparkles className="w-12 h-12 mx-auto text-gold mb-4" />
          <h2 className="text-2xl font-bold mb-2">Generate New Brief</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Let AI research the latest legal developments and create a new intelligence briefing.
          </p>
          <Button
            size="lg"
            className="btn-gold text-lg px-8"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <span className="animate-pulse mr-2">🤖</span>
                Connecting to AI Brain...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate with AI
              </>
            )}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4 text-center">
            <FileText className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
            <p className="text-2xl font-bold">{allBriefs?.length || 0}</p>
            <p className="text-sm text-muted-foreground">Total Briefs</p>
          </div>
          <div className="glass-card p-4 text-center">
            <Clock className="w-6 h-6 mx-auto text-gold mb-2" />
            <p className="text-2xl font-bold">{draftBriefs.length}</p>
            <p className="text-sm text-muted-foreground">Drafts</p>
          </div>
          <div className="glass-card p-4 text-center">
            <Calendar className="w-6 h-6 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold">{scheduledBriefs.length}</p>
            <p className="text-sm text-muted-foreground">Scheduled</p>
          </div>
          <div className="glass-card p-4 text-center">
            <CheckCircle className="w-6 h-6 mx-auto text-accent mb-2" />
            <p className="text-2xl font-bold">{activeBriefs.length}</p>
            <p className="text-sm text-muted-foreground">Published</p>
          </div>
        </div>

        {/* Drafts Section */}
        <section>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gold" />
            Drafts Awaiting Review
          </h3>
          
          {draftsLoading ? (
            <div className="grid gap-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="skeleton h-24 rounded-xl" />
              ))}
            </div>
          ) : draftBriefs.length === 0 ? (
            <div className="glass-card p-8 text-center text-muted-foreground">
              No drafts. Generate a new brief to get started!
            </div>
          ) : (
            <div className="grid gap-4">
              {draftBriefs.map((brief) => (
                <button
                  key={brief.id}
                  onClick={() => setSelectedBrief(brief)}
                  className="glass-card hover-lift p-4 md:p-6 text-left flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full"
                >
                  {brief.cover_image && (
                    <img
                      src={brief.cover_image}
                      alt=""
                      className="w-full sm:w-24 h-32 sm:h-16 object-cover rounded-lg shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-lg truncate">{brief.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Created {format(new Date(brief.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  <span className="text-primary font-medium">Edit →</span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Scheduled Section */}
        <section>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Scheduled for Publication
          </h3>
          
          {scheduledLoading ? (
            <div className="grid gap-4">
              {[...Array(1)].map((_, i) => (
                <div key={i} className="skeleton h-24 rounded-xl" />
              ))}
            </div>
          ) : scheduledBriefs.length === 0 ? (
            <div className="glass-card p-8 text-center text-muted-foreground">
              No scheduled briefs. Set a future publish date to schedule.
            </div>
          ) : (
            <div className="grid gap-4">
              {scheduledBriefs.map((brief) => (
                <button
                  key={brief.id}
                  onClick={() => setSelectedBrief(brief)}
                  className="glass-card hover-lift p-4 md:p-6 text-left flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full border-l-4 border-primary"
                >
                  {brief.cover_image && (
                    <img
                      src={brief.cover_image}
                      alt=""
                      className="w-full sm:w-24 h-32 sm:h-16 object-cover rounded-lg shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-lg truncate">{brief.title}</h4>
                    </div>
                    <p className="text-sm text-primary font-medium">
                      Scheduled for {format(new Date(brief.publish_date), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  <span className="text-primary font-medium">Edit →</span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Published Section */}
        <section>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-accent" />
            Published Briefs
          </h3>
          
          {activeBriefs.length === 0 ? (
            <div className="glass-card p-8 text-center text-muted-foreground">
              No published briefs yet.
            </div>
          ) : (
            <div className="grid gap-4">
              {activeBriefs.map((brief) => (
                <button
                  key={brief.id}
                  onClick={() => setSelectedBrief(brief)}
                  className="glass-card hover-lift p-4 md:p-6 text-left flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full"
                >
                  {brief.cover_image && (
                    <img
                      src={brief.cover_image}
                      alt=""
                      className="w-full sm:w-24 h-32 sm:h-16 object-cover rounded-lg shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="font-semibold text-lg truncate">{brief.title}</h4>
                      <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs">
                        LIVE
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Published {format(new Date(brief.publish_date), "MMM d, yyyy")}
                    </p>
                  </div>
                  <span className="text-primary font-medium">Edit →</span>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function AdminPage() {
  const { isAuthenticated } = useAdminAuth();

  if (!isAuthenticated) {
    return <PinLogin />;
  }

  return <AdminDashboard />;
}

const Admin = () => (
  <AdminAuthProvider>
    <AdminPage />
  </AdminAuthProvider>
);

export default Admin;
