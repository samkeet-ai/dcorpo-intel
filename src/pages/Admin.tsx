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

// ==============================================================================
// 🔑 API KEYS SECTION (PASTE YOUR KEYS HERE)
// ==============================================================================
const GEMINI_API_KEY = "AIzaSyClEbwmRGZjp8U4zyaz9JQoydO2EqL0SMc";
const TAVILY_API_KEY = "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";
// ==============================================================================

function AdminDashboard() {
  const { user, signOut, isAdmin, logAction } = useAuth();
  const [selectedBrief, setSelectedBrief] = useState<AdminBrief | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState(""); 
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

  // --- FRONTEND GENERATOR (BYPASSING SERVER) ---
  const handleGenerate = async () => {
    if (!isAdmin) return toast.error("Admin required");
    
    // Safety Check: Did you paste the keys?
    if (GEMINI_API_KEY.includes("PASTE") || TAVILY_API_KEY.includes("PASTE")) {
       return toast.error("MISSING KEYS: Open Admin.tsx and paste API keys at the top of the file.");
    }

    setIsGenerating(true);
    setStatusMessage("Searching the web (Tavily)...");

    try {
      // 1. SEARCH WEB (Tavily)
      const searchTopic = topic.trim() || "Latest legal technology regulations India EU USA 2026";
      console.log("Searching:", searchTopic);
      
      const tavilyResponse = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: TAVILY_API_KEY,
          query: searchTopic,
          search_depth: "advanced",
          include_answer: true,
          max_results: 5
        })
      });

      if (!tavilyResponse.ok) {
        const err = await tavilyResponse.text();
        throw new Error(`Tavily Search Failed: ${err}`);
      }
      
      const searchData = await tavilyResponse.json();
      const context = searchData.results.map((r: any) => `- ${r.title}: ${r.content}`).join("\n");

      // 2. GENERATE CONTENT (Gemini via REST API)
      setStatusMessage("Synthesizing Brief (Gemini)...");
      
      const geminiPrompt = `
      You are a Senior Legal Consultant.
      Context from web search:
      ${context}
      
      Task: Write a structured legal brief about "${searchTopic}" based on the context.
      Output strictly valid JSON:
      {
        "title": "Headline (Max 80 chars)",
        "summary": "2 sentence executive summary",
        "content": "Full markdown article with ## Headers, bullet points, and citations.",
        "category": "Legal Tech"
      }`;

      // Call Google Gemini API directly
      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
           contents: [{ parts: [{ text: geminiPrompt }] }]
        })
      });

      if (!geminiResponse.ok) {
         const err = await geminiResponse.text();
         throw new Error(`Gemini API Failed: ${err}`);
      }

      const geminiData = await geminiResponse.json();
      const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!rawText) throw new Error("Gemini returned empty response");

      // Clean JSON
      const jsonText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      const briefData = JSON.parse(jsonText);

      // 3. SAVE TO DB
      setStatusMessage("Saving to Database...");
      const { data, error } = await supabase.from("legal_briefs").insert({
        title: briefData.title,
        summary: briefData.summary,
        content: briefData.content,
        category: briefData.category,
        is_published: false,
        author_id: user?.id,
      }).select().single();

      if (error) throw error;

      await logAction("Generated Brief", { briefId: data.id });
      toast.success("Success! Brief Generated.");
      setTopic("");
      handleRefresh();

    } catch (error: any) {
      console.error("Generator Error:", error);
      toast.error("Generation Failed", { description: error.message });
    } finally {
      setIsGenerating(false);
      setStatusMessage("");
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
                  Let AI research the latest legal developments. (Frontend Mode)
                </p>
                <div className="space-y-2 mb-4 max-w-lg mx-auto text-left">
                  <Label>Topic</Label>
                  <Input 
                    placeholder="e.g. India DPDPA Rules, EU AI Act..." 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    disabled={isGenerating}
                  />
                </div>
                <Button size="lg" className="btn-gold text-lg px-8" onClick={handleGenerate} disabled={isGenerating}>
                  {isGenerating ? (
                    <><span className="animate-pulse mr-2">🤖</span>{statusMessage}</>
                  ) : (
                    <><Sparkles className="w-5 h-5 mr-2" />Generate with AI</>
                  )}
                </Button>
              </div>
            )}
            
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
            <section className="mt-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gold" /> Drafts Awaiting Review
                </h3>
                <Button variant="outline" size="sm" onClick={handleRefresh}><RefreshCw className="w-4 h-4 mr-2" /> Refresh List</Button>
              </div>
               {draftBriefs.length === 0 ? <div className="p-8 text-center text-muted-foreground glass-card">No drafts.</div> : (
                <div className="grid gap-4">
                  {draftBriefs.map((brief) => (
                    <div key={brief.id} onClick={() => setSelectedBrief(brief)} className="glass-card hover-lift p-4 flex justify-between items-center cursor-pointer group">
                      <div>
                        <h4 className="font-semibold">{brief.title}</h4>
                        <p className="text-sm text-muted-foreground">{format(new Date(brief.created_at), "MMM d, yyyy")}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={(e) => handleDelete(e, brief.id)}><Trash2 className="w-4 h-4"/></Button>
                      </div>
                    </div>
                  ))}
                </div>
               )}
            </section>
            
            {/* Published Section */}
            <section className="mt-8">
               <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-accent" /> Published Briefs</h3>
               {publishedBriefs.length === 0 ? <div className="p-8 text-center text-muted-foreground glass-card">No published briefs.</div> : (
                <div className="grid gap-4">
                  {publishedBriefs.map((brief) => (
                    <div key={brief.id} onClick={() => setSelectedBrief(brief)} className="glass-card hover-lift p-4 flex justify-between items-center cursor-pointer group">
                      <div>
                        <h4 className="font-semibold">{brief.title}</h4>
                         <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">LIVE</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={(e) => handleDelete(e, brief.id)}><Trash2 className="w-4 h-4"/></Button>
                      </div>
                    </div>
                  ))}
                </div>
               )}
            </section>

          </TabsContent>
          <TabsContent value="analytics">
              <div className="glass-card p-8"><h2 className="text-3xl font-bold">{subscriberCount ?? "—"}</h2><p>Subscribers</p></div>
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
