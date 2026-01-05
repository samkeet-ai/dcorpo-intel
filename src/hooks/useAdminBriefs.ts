import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AdminBrief {
  id: string;
  title: string;
  content: string;
  category: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export function useAdminBriefs() {
  return useQuery({
    queryKey: ["admin-briefs"],
    queryFn: async (): Promise<AdminBrief[]> => {
      const { data, error } = await supabase
        .from("legal_briefs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useDraftBriefs() {
  return useQuery({
    queryKey: ["draft-briefs"],
    queryFn: async (): Promise<AdminBrief[]> => {
      const { data, error } = await supabase
        .from("legal_briefs")
        .select("*")
        .eq("is_published", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function usePublishedBriefs() {
  return useQuery({
    queryKey: ["published-briefs"],
    queryFn: async (): Promise<AdminBrief[]> => {
      const { data, error } = await supabase
        .from("legal_briefs")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useUpdateBrief() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (brief: Partial<AdminBrief> & { id: string }) => {
      const { id, ...updateData } = brief;

      const { error } = await supabase
        .from("legal_briefs")
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-briefs"] });
      queryClient.invalidateQueries({ queryKey: ["draft-briefs"] });
      queryClient.invalidateQueries({ queryKey: ["published-briefs"] });
      toast.success("Brief updated successfully!");
    },
    onError: (error) => {
      console.error("Brief update error:", error);
      toast.error("Failed to update brief. Please try again.");
    },
  });
}

export function usePublishBrief() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("legal_briefs")
        .update({
          is_published: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-briefs"] });
      queryClient.invalidateQueries({ queryKey: ["draft-briefs"] });
      queryClient.invalidateQueries({ queryKey: ["published-briefs"] });
      toast.success("Brief published!");
    },
    onError: (error) => {
      console.error("Brief publish error:", error);
      toast.error("Failed to publish. Please try again.");
    },
  });
}

export function useUnpublishBrief() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("legal_briefs")
        .update({
          is_published: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-briefs"] });
      queryClient.invalidateQueries({ queryKey: ["draft-briefs"] });
      queryClient.invalidateQueries({ queryKey: ["published-briefs"] });
      toast.success("Brief unpublished!");
    },
    onError: (error) => {
      console.error("Brief unpublish error:", error);
      toast.error("Failed to unpublish. Please try again.");
    },
  });
}
