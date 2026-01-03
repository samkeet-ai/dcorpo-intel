import { useState } from "react";
import { LogOut, Sparkles, FileText, Clock, CheckCircle, Calendar, RefreshCw, Newspaper, Users, Plus } from "lucide-react";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { BriefEditor } from "@/components/admin/BriefEditor";
import { useDraftBriefs, useAdminBriefs, useScheduledBriefs, AdminBrief } from "@/hooks/useAdminBriefs";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

function AdminDashboard() {
  const { user, signOut, isAdmin, logAction } = useAuth();
  const [selectedBrief, setSelectedBrief] = useState<AdminBrief | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("newsroom");
  const { data: drafts, isLoading: draftsLoading, refetch: refetchDrafts } = useDraftBriefs();
  const { data: scheduled, isLoading: scheduledLoading, refetch: refetchScheduled } = useScheduledBriefs();
  const { data: allBriefs, refetch: refetchAll } = useAdminBriefs();
  const queryClient = useQueryClient();

  // Subscriber count query (only for admins)
  const { data: subscriberCount } = useQuery({
    queryKey: ["subscriber-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("subscribers")
        .select("*", { count: "exact", head: true });
      
      if (error) throw error;
      return count || 0;
    },
    enabled: isAdmin,
  });

  const handleLogout = async () => {
    await logAction("Logout");
    await signOut();
    toast.success("Logged out successfully");
  };

  const handleRefresh = async () => {
    toast.info("Refreshing briefs...");
    await Promise.all([refetchDrafts(), refetchScheduled(), refetchAll()]);
    toast.success("Briefs refreshed!");
  };

  const handleGenerate = async () => {
    if (!isAdmin) {
      toast.error("Admin access required");
      return;
    }

    setIsGenerating(true);
    toast.info("AI is researching latest laws...", {
      description: "This may take up to 30 seconds.",
    });
    
    try {
      const { data, error } = await supabase.functions.invoke("generate-brief");
      
      if (error) throw error;

      await logAction("Generated Brief", { briefId: data?.brief?.id });
      
      toast.success("New brief generated!", {
        description: "Check your drafts to review and edit.",
      });
      
      // Refresh the briefs lists
      queryClient.invalidateQueries({ queryKey: ["draft-briefs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-briefs"] });
      queryClient.invalidateQueries({ queryKey: ["scheduled-briefs"] });
    } catch (error: any) {
      console.error("Generation error:", error);
      toast.error("Failed to generate brief", {
        description: "Please try again later.",
      });
    } finally {
      setIsGenerating(false);
    }
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
            {isAdmin && (
              <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-medium">
                ADMIN
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">{user?.email}</span>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content with Tabs */}
      <main className="max-w-6xl mx-auto p-4 md:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="newsroom" className="flex items-center gap-2">
              <Newspaper className="w-4 h-4" />
              Newsroom
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="newsroom" className="space-y-8">
            {/* Generate Button */}
            {isAdmin && (
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
            )}

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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gold" />
                  Drafts Awaiting Review
                </h3>
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh List
                </Button>
              </div>
              
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
          </TabsContent>

          <TabsContent value="analytics" className="space-y-8">
            {/* Subscriber Stats */}
            <div className="glass-card p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                  <Users className="w-8 h-8 text-accent" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold">{subscriberCount ?? "—"}</h2>
                  <p className="text-muted-foreground">Total Newsletter Subscribers</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Subscriber data is protected by RLS policies. Only admins can view this information.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="glass-card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Quick Actions
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  <Sparkles className="w-5 h-5 mb-2 text-gold" />
                  <span className="font-medium">Generate AI Brief</span>
                  <span className="text-xs text-muted-foreground">Create new legal intelligence</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start"
                  onClick={handleRefresh}
                >
                  <RefreshCw className="w-5 h-5 mb-2 text-primary" />
                  <span className="font-medium">Refresh Data</span>
                  <span className="text-xs text-muted-foreground">Sync latest changes</span>
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function AdminPage() {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AdminLogin />;
  }

  // Check admin access
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card p-8 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold text-destructive mb-4">Access Denied</h2>
          <p className="text-muted-foreground mb-6">
            You don't have admin privileges to access the dashboard. 
            Please contact the administrator if you believe this is an error.
          </p>
          <p className="text-sm text-muted-foreground">Logged in as: {user.email}</p>
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
}

export default AdminPage;
