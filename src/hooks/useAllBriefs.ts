import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BriefSummary {
  id: string;
  title: string;
  cover_image: string | null;
  publish_date: string;
  status: string;
  created_at: string;
}

export function useAllBriefs(searchQuery?: string) {
  return useQuery({
    queryKey: ["all-briefs", searchQuery],
    queryFn: async (): Promise<BriefSummary[]> => {
      let query = supabase
        .from("weekly_briefs")
        .select("id, title, cover_image, publish_date, status, created_at")
        .eq("status", "active")
        .lte("publish_date", new Date().toISOString())
        .order("publish_date", { ascending: false });

      if (searchQuery && searchQuery.trim()) {
        query = query.ilike("title", `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as BriefSummary[];
    },
  });
}

export function useBriefsByMonth() {
  return useQuery({
    queryKey: ["briefs-by-month"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_briefs")
        .select("id, title, cover_image, publish_date, status, created_at")
        .eq("status", "active")
        .lte("publish_date", new Date().toISOString())
        .order("publish_date", { ascending: false });

      if (error) throw error;

      // Group by month
      const grouped: Record<string, BriefSummary[]> = {};
      (data as BriefSummary[]).forEach((brief) => {
        const date = new Date(brief.publish_date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(brief);
      });

      return grouped;
    },
  });
}
