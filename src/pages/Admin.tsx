import { useState } from "react";
// Added Trash2 to imports
import { LogOut, Sparkles, FileText, Clock, CheckCircle, RefreshCw, Newspaper, Users, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { BriefEditor } from "@/components/admin/BriefEditor";
import { useDraftBriefs, useAdminBriefs, usePublishedBriefs, AdminBrief } from "@/hooks/useAdminBriefs";
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
  const [topic, setTopic] = useState("");
  const { data: drafts, isLoading: draftsLoading, refetch: refetchDrafts } = useDraftBriefs();
  const { data: published, isLoading: publishedLoading, refetch: refetchPublished } = usePublishedBriefs();
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
    await Promise.all([refetchDrafts(), refetchPublished(), refetchAll()]);
    toast.success("Briefs refreshed!");
  };

  // --- NEW DELETE FUNCTION ---
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent opening the editor
    if (!window.confirm("Are you sure you want to delete this brief? This cannot be undone.")) return;

    try {
      const { error } = await supabase.from("legal_briefs").delete().eq("id", id);
      if (error) throw error;
      
      toast.success("Brief deleted successfully");
      // Refresh lists
      queryClient.invalidateQueries({ queryKey: ["draft-briefs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-briefs"] });
      queryClient.invalidateQueries({ queryKey: ["published-briefs"] });
    } catch (error: any) {
      toast.error("Failed to delete brief", { description: error.message });
    }
  };
  // ---------------------------

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("No valid session.");

      // Sends topic to backend
      const { data, error } = await supabase.functions.invoke("generate-brief", {
        body: { topic: topic },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      await logAction("Generated Brief", { briefId: data?.brief?.id });
      toast.success("New brief generated!");
      setTopic("");
      
      queryClient.invalidateQueries({ queryKey: ["draft-briefs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-briefs"] });
      queryClient.invalidateQueries({ queryKey: ["published-briefs"] });
    } catch (error: any) {
      console.error("Generation error:", error);
      toast.error("Failed to generate brief", {
        description: error.message || "Please try again later.",
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

  const draftBriefs = drafts || [];
  const publishedBriefs = published || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">d</span>
            </div>
            <span className="font-bold text-xl">The Newsroom</span>
            {isAdmin && <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-medium">ADMIN</span>}
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
            {isAdmin && (
              <div className="glass-card p-6 md:p-8 text-center">
                <Sparkles className="w-12 h-12 mx-auto text-gold mb-4" />
                <h2 className="text-2xl font-bold mb-2">Generate New Brief</h2>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  Let AI research the latest legal developments and create a new intelligence briefing.
                </p>
                <div className="space-y-2 mb-4 max-w-lg mx-auto text-left">
                  <Label>Topic (Optional)</Label>
                  <Input 
                    placeholder="e.g. India DPDPA Rules, EU AI Act..." 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    disabled={isGenerating}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave blank for a random trending topic.
                  </p>
                </div>
                <Button size="lg" className="btn-gold text-lg px-8" onClick={handleGenerate} disabled={isGenerating}>
                  {isGenerating ? (
                    <><span className="animate-pulse mr-2">🤖</span>Connecting to AI Brain...</>
                  ) : (
                    <><Sparkles className="w-5 h-5 mr-2" />Generate with AI</>
                  )}
                </Button>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                <CheckCircle className="w-6 h-6 mx-auto text-accent mb-2" />
                <p className="text-2xl font-bold">{publishedBriefs.length}</p>
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
                  {[...Array(2)].map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
                </div>
              ) : draftBriefs.length === 0 ? (
                <div className="glass-card p-8 text-center text-muted-foreground">
                  No drafts. Generate a new brief to get started!
                </div>
              ) : (
                <div className="grid gap-4">
                  {draftBriefs.map((brief) => (
                    <div
                      key={brief.id}
                      onClick={() => setSelectedBrief(brief)}
                      className="glass-card hover-lift p-4 md:p-6 text-left flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full cursor-pointer group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="font-semibold text-lg truncate">{brief.title}</h4>
                          <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs">
                            {brief.category}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Created {format(new Date(brief.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-primary font-medium group-hover:underline">Edit</span>
                         {/* DELETE BUTTON */}
                         <Button 
                           variant="ghost" 
                           size="icon" 
                           className="text-destructive hover:bg-destructive/10"
                           onClick={(e) => handleDelete(e, brief.id)}
                         >
                           <Trash2 className="w-4 h-4" />
                         </Button>
                      </div>
                    </div>
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

              {publishedLoading ? (
                <div className="grid gap-4">
                  {[...Array(2)].map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
                </div>
              ) : publishedBriefs.length === 0 ? (
                <div className="glass-card p-8 text-center text-muted-foreground">
                  No published briefs yet.
                </div>
              ) : (
                <div className="grid gap-4">
                  {publishedBriefs.map((brief) => (
                    <div
                      key={brief.id}
                      onClick={() => setSelectedBrief(brief)}
                      className="glass-card hover-lift p-4 md:p-6 text-left flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full cursor-pointer group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="font-semibold text-lg truncate">{brief.title}</h4>
                          <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs">LIVE</span>
                          <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs">{brief.category}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Updated {format(new Date(brief.updated_at), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-primary font-medium group-hover:underline">Edit</span>
                         {/* DELETE BUTTON */}
                         <Button 
                           variant="ghost" 
                           size="icon" 
                           className="text-destructive hover:bg-destructive/10"
                           onClick={(e) => handleDelete(e, brief.id)}
                         >
                           <Trash2 className="w-4 h-4" />
                         </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-8">
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
              <p className="text-sm text-muted-foreground">Subscriber data is protected by RLS policies. Only admins can view this information.</p>
            </div>
            <div className="glass-card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Plus className="w-5 h-5" /> Quick Actions</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Button variant="outline" className="h-auto p-4 flex flex-col items-start" onClick={handleGenerate} disabled={isGenerating}>
                  <Sparkles className="w-5 h-5 mb-2 text-gold" />
                  <span className="font-medium">Generate AI Brief</span>
                  <span className="text-xs text-muted-foreground">Create new legal intelligence</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col items-start" onClick={handleRefresh}>
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
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" /><p className="text-muted-foreground">Verifying access...</p></div></div>;
  if (!user) return <AdminLogin />;
  if (!isAdmin) return <div className="min-h-screen bg-background flex items-center justify-center p-4"><div className="glass-card p-8 max-w-md w-full text-center"><h2 className="text-xl font-bold text-destructive mb-2">Access Denied</h2><p className="text-muted-foreground">You do not have admin privileges. Contact support if you believe this is an error.</p></div></div>;
  return <AdminDashboard />;
}

export default AdminPage;
