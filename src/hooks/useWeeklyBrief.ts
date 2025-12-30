import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WeeklyBrief {
  id: string;
  title: string;
  cover_image: string | null;
  publish_date: string;
  status: string;
  deep_dive_text: string | null;
  fun_fact: string | null;
  radar_points: string[];
  jargon_term: string | null;
  jargon_def: string | null;
  audio_summary_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useWeeklyBrief() {
  return useQuery({
    queryKey: ["weekly-brief"],
    queryFn: async (): Promise<WeeklyBrief | null> => {
      const { data, error } = await supabase
        .from("weekly_briefs")
        .select("*")
        .eq("status", "active")
        .lte("publish_date", new Date().toISOString())
        .order("publish_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      // Parse radar_points from JSON if it's a string
      if (data && data.radar_points) {
        return {
          ...data,
          radar_points: typeof data.radar_points === 'string' 
            ? JSON.parse(data.radar_points) 
            : data.radar_points as string[]
        };
      }
      
      return data as WeeklyBrief | null;
    },
  });
}
