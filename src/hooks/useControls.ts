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
      console.log("🔧 [1] useUpdateControl: Starting control update for ID:", id);
      console.log("🔧 [2] useUpdateControl: Update data:", updates);
      
      // Get control data for audit log
      const { data: control } = await supabase
        .from("controls")
        .select("control_id, title")
        .eq("id", id)
        .single();
      
      console.log("🔧 [3] useUpdateControl: Control info:", control);
      
      const { error } = await supabase
        .from("controls")
        .update(updates)
        .eq("id", id);
      
      if (error) {
        console.error("❌ [4] useUpdateControl: Update error:", error);
        throw error;
      }

      console.log("✅ [5] useUpdateControl: Update successful, now logging...");

      // Log audit event
      try {
        await logAuditEvent({
          action: 'update',
          entityType: 'control',
          entityId: id,
          entityName: control ? `${control.control_id} - ${control.title}` : 'Unknown Control',
          oldValues: oldData,
          newValues: updates,
          notes: 'Control updated from wizard'
        });
        console.log("✅ [6] useUpdateControl: Audit event logged successfully");
      } catch (logError) {
        console.error("⚠️ [6] useUpdateControl: Audit logging failed but update succeeded:", logError);
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
