import { useState } from "react";
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

  const { data: subscriberCount } = useQuery({
    queryKey: ["subscriber-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("subscribers").select("*", { count: "exact", head: true });
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

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this brief?")) return;
    try {
      const { error } = await supabase.from("legal_briefs").delete().eq("id", id);
      if (error) throw error;
      toast.success("Brief deleted");
      queryClient.invalidateQueries({ queryKey: ["draft-briefs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-briefs"] });
      queryClient.invalidateQueries({ queryKey: ["published-briefs"] });
    } catch (error: any) {
      toast.error("Delete failed", { description: error.message });
    }
  };

  const handleGenerate = async () => {
    if (!isAdmin) return toast.error("Admin required");
    
    setIsGenerating(true);
    toast.info("AI is researching latest laws...", { description: "This may take up to 30 seconds." });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("No valid session.");

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
      toast.error("Failed to generate brief", { description: error.message || "Please try again later." });
    } finally {
      setIsGenerating(false);
    }
  };

  if (selectedBrief) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <BriefEditor brief={selectedBrief} onBack={() => setSelectedBrief(null)} />
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
            <Button variant="ghost" onClick={handleLogout}><LogOut className="w-4 h-4 mr-2" /><span className="hidden sm:inline">Logout</span></Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="newsroom" className="flex items-center gap-2"><Newspaper className="w-4 h-4" />Newsroom</TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2"><Users className="w-4 h-4" />Analytics</TabsTrigger>
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
                  <p className="text-xs text-muted-foreground">Leave blank for a random trending topic.</p>
                </div>
                <Button onClick={handleGenerate} disabled={isGenerating} size="lg" className="bg-gold hover:bg-gold/90 text-black">
                  {isGenerating ? (
                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Generating...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" />Generate with AI</>
                  )}
                </Button>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="glass-card p-4 text-center">
                <FileText className="w-6 h-6 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold">{allBriefs?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Total Briefs</p>
              </div>
              <div className="glass-card p-4 text-center">
                <Clock className="w-6 h-6 mx-auto text-amber-500 mb-2" />
                <p className="text-2xl font-bold">{draftBriefs.length}</p>
                <p className="text-xs text-muted-foreground">Drafts</p>
              </div>
              <div className="glass-card p-4 text-center">
                <CheckCircle className="w-6 h-6 mx-auto text-emerald-500 mb-2" />
                <p className="text-2xl font-bold">{publishedBriefs.length}</p>
                <p className="text-xs text-muted-foreground">Published</p>
              </div>
            </div>

            {/* Drafts Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  <h3 className="font-semibold">Drafts Awaiting Review</h3>
                </div>
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <RefreshCw className="w-4 h-4 mr-2" />Refresh List
                </Button>
              </div>

              {draftsLoading ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => <div key={i} className="h-24 bg-muted/50 rounded-lg animate-pulse" />)}
                </div>
              ) : draftBriefs.length === 0 ? (
                <div className="glass-card p-8 text-center text-muted-foreground">
                  No drafts. Generate a new brief to get started!
                </div>
              ) : (
                <div className="space-y-3">
                  {draftBriefs.map((brief) => (
                    <button
                      key={brief.id}
                      onClick={() => setSelectedBrief(brief)}
                      className="glass-card hover-lift p-4 md:p-6 text-left flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full cursor-pointer group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold truncate">{brief.title}</h4>
                          <span className="px-2 py-0.5 rounded-full bg-muted text-xs">{brief.category}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Created {format(new Date(brief.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-primary group-hover:underline">Edit</span>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={(e) => handleDelete(e, brief.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Published Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <h3 className="font-semibold">Published Briefs</h3>
              </div>

              {publishedLoading ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => <div key={i} className="h-24 bg-muted/50 rounded-lg animate-pulse" />)}
                </div>
              ) : publishedBriefs.length === 0 ? (
                <div className="glass-card p-8 text-center text-muted-foreground">
                  No published briefs yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {publishedBriefs.map((brief) => (
                    <button
                      key={brief.id}
                      onClick={() => setSelectedBrief(brief)}
                      className="glass-card hover-lift p-4 md:p-6 text-left flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full cursor-pointer group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold truncate">{brief.title}</h4>
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 text-xs font-medium">LIVE</span>
                          <span className="px-2 py-0.5 rounded-full bg-muted text-xs">{brief.category}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Updated {format(new Date(brief.updated_at), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-primary group-hover:underline">Edit</span>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={(e) => handleDelete(e, brief.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="glass-card p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{subscriberCount ?? "—"}</p>
                  <p className="text-sm text-muted-foreground">Total Newsletter Subscribers</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">Subscriber data is protected by RLS policies. Only admins can view this information.</p>
            </div>
            <div className="glass-card p-6">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="grid gap-3">
                <Button variant="outline" className="justify-start" onClick={handleGenerate} disabled={isGenerating}>
                  <Sparkles className="w-4 h-4 mr-2" />Generate AI Brief
                  <span className="ml-auto text-xs text-muted-foreground">Create new legal intelligence</span>
                </Button>
                <Button variant="outline" className="justify-start" onClick={handleRefresh}>
                  <RefreshCw className="w-4 h-4 mr-2" />Refresh Data
                  <span className="ml-auto text-xs text-muted-foreground">Sync latest changes</span>
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
  if (loading) return <div className="min-h-screen flex items-center justify-center">Verifying access...</div>;
  if (!user) return <AdminLogin />;
  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center flex-col gap-4"><h1 className="text-2xl font-bold">Access Denied</h1><p className="text-muted-foreground">You do not have admin privileges. Contact support if you believe this is an error.</p></div>;
  return <AdminDashboard />;
}

export default AdminPage;
