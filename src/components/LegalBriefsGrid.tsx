import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Calendar, Tag } from "lucide-react";
import { format } from "date-fns";

interface LegalBrief {
  id: string;
  title: string;
  content: string;
  category: string;
  is_published: boolean;
  created_at: string;
}

export function LegalBriefsGrid() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: briefs, isLoading } = useQuery({
    queryKey: ["legal-briefs-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legal_briefs")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as LegalBrief[];
    },
  });

  const filteredBriefs = useMemo(() => {
    if (!briefs) return [];
    if (!searchQuery.trim()) return briefs;

    const query = searchQuery.toLowerCase();
    return briefs.filter(
      (brief) =>
        brief.title.toLowerCase().includes(query) ||
        brief.content.toLowerCase().includes(query) ||
        brief.category.toLowerCase().includes(query)
    );
  }, [briefs, searchQuery]);

  const categoryColors: Record<string, string> = {
    "Cyber Law": "bg-primary/20 text-primary border-primary/30",
    "DPDPA": "bg-accent/20 text-accent border-accent/30",
    "AI Regulation": "bg-gold/20 text-gold border-gold/30",
    "GDPR": "bg-destructive/20 text-destructive border-destructive/30",
    "General": "bg-muted text-muted-foreground border-border",
  };

  if (isLoading) {
    return (
      <section className="py-16 px-4 sm:px-6" id="briefs">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-64 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 sm:px-6" id="briefs">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Legal <span className="text-gradient-gold">Intelligence</span> Briefs
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Stay informed with our curated legal analysis on regulatory developments, 
            compliance updates, and emerging legal tech trends.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search briefs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-secondary border-border"
            />
          </div>
        </div>

        {/* Grid */}
        {filteredBriefs.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No briefs found</h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search terms"
                : "Check back soon for new legal intelligence"}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBriefs.map((brief) => (
              <Card
                key={brief.id}
                className="glass-card hover-lift cursor-pointer group h-full flex flex-col"
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      variant="outline"
                      className={categoryColors[brief.category] || categoryColors["General"]}
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {brief.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(brief.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                    {brief.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-muted-foreground text-sm line-clamp-4 flex-1">
                    {brief.content.replace(/[#*`]/g, "").substring(0, 200)}...
                  </p>
                  <button className="mt-4 text-sm text-primary font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                    Read full brief
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
