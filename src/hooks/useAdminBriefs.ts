import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AdminBrief {
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
  linkedin_caption: string | null;
  created_at: string;
  updated_at: string;
}

export function useAdminBriefs() {
  return useQuery({
    queryKey: ["admin-briefs"],
    queryFn: async (): Promise<AdminBrief[]> => {
      const { data, error } = await supabase
        .from("weekly_briefs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      return (data || []).map((brief) => ({
        ...brief,
        radar_points: typeof brief.radar_points === 'string' 
          ? JSON.parse(brief.radar_points) 
          : (brief.radar_points as string[]) || []
      }));
    },
  });
}

export function useDraftBriefs() {
  return useQuery({
    queryKey: ["draft-briefs"],
    queryFn: async (): Promise<AdminBrief[]> => {
      const { data, error } = await supabase
        .from("weekly_briefs")
        .select("*")
        .eq("status", "draft")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      return (data || []).map((brief) => ({
        ...brief,
        radar_points: typeof brief.radar_points === 'string' 
          ? JSON.parse(brief.radar_points) 
          : (brief.radar_points as string[]) || []
      }));
    },
  });
}

export function useUpdateBrief() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (brief: Partial<AdminBrief> & { id: string }) => {
      const { id, ...updateData } = brief;
      
      // Convert radar_points array to JSON for storage
      const dataToUpdate = {
        ...updateData,
        radar_points: updateData.radar_points 
          ? JSON.stringify(updateData.radar_points) 
          : undefined,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from("weekly_briefs")
        .update(dataToUpdate)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-briefs"] });
      queryClient.invalidateQueries({ queryKey: ["draft-briefs"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-brief"] });
      toast.success("Brief updated successfully!");
    },
    onError: (error) => {
      toast.error("Failed to update brief: " + error.message);
    },
  });
}

export function usePublishBrief() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // First, set all other briefs to draft
      await supabase
        .from("weekly_briefs")
        .update({ status: "draft" })
        .eq("status", "active");

      // Then publish this one
      const { error } = await supabase
        .from("weekly_briefs")
        .update({ 
          status: "active", 
          publish_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-briefs"] });
      queryClient.invalidateQueries({ queryKey: ["draft-briefs"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-brief"] });
      toast.success("Brief published!");
    },
    onError: (error) => {
      toast.error("Failed to publish: " + error.message);
    },
  });
}
