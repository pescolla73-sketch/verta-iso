import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logAuditEvent } from "@/utils/auditLog";

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
    mutationFn: async ({ id, updates, oldData }: { id: string; updates: any; oldData?: any }) => {
      console.log("Updating control:", id, updates);
      
      // Get control data for audit log
      const { data: control } = await supabase
        .from("controls")
        .select("control_id, title")
        .eq("id", id)
        .single();
      
      const { error } = await supabase
        .from("controls")
        .update(updates)
        .eq("id", id);
      
      if (error) {
        console.error("Update error:", error);
        throw error;
      }

      // Log audit event
      await logAuditEvent({
        action: 'update',
        entityType: 'control',
        entityId: id,
        entityName: control ? `${control.control_id} - ${control.title}` : 'Unknown Control',
        oldValues: oldData,
        newValues: updates,
        notes: 'Control updated'
      });
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
