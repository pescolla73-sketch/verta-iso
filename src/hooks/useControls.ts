import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useControls() {
  return useQuery({
    queryKey: ["controls"],
    queryFn: async () => {
      console.log("Fetching controls from Supabase...");
      const { data, error } = await supabase
        .from("controls")
        .select("*")
        .order("control_id");
      
      if (error) {
        console.error("Supabase error:", error);
        toast.error(`Errore nel caricamento dei controlli: ${error.message}`);
        throw error;
      }
      
      console.log("Controls fetched:", data?.length || 0, "records");
      return data || [];
    },
  });
}

export function useUpdateControl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      console.log("Updating control:", id, updates);
      const { error } = await supabase
        .from("controls")
        .update(updates)
        .eq("id", id);
      
      if (error) {
        console.error("Update error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch controls
      queryClient.invalidateQueries({ queryKey: ["controls"] });
      console.log("Controls cache invalidated");
      toast.success("Controllo aggiornato");
    },
    onError: (error: any) => {
      console.error("Update failed:", error);
      toast.error(`Errore nell'aggiornamento: ${error.message}`);
    }
  });
}
