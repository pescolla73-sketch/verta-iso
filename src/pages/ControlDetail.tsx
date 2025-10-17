import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ControlFormData = {
  status: string;
  implementation_notes: string;
  responsible: string;
};

export default function ControlDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: control, isLoading } = useQuery({
    queryKey: ["control", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("controls")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) {
        toast.error("Errore nel caricamento del controllo");
        throw error;
      }
      
      return data;
    },
  });

  const form = useForm<ControlFormData>({
    defaultValues: {
      status: control?.status || "not_implemented",
      implementation_notes: control?.implementation_notes || "",
      responsible: control?.responsible || "",
    },
    values: control ? {
      status: control.status,
      implementation_notes: control.implementation_notes || "",
      responsible: control.responsible || "",
    } : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ControlFormData) => {
      const { error } = await supabase
        .from("controls")
        .update(data)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["control", id] });
      toast.success("Controllo aggiornato con successo");
    },
    onError: () => {
      toast.error("Errore nell'aggiornamento del controllo");
    },
  });

  const onSubmit = (data: ControlFormData) => {
    updateMutation.mutate(data);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "implemented":
        return "Implementato";
      case "in_progress":
        return "Parzialmente Implementato";
      case "not_implemented":
        return "Non Implementato";
      case "not_applicable":
        return "Non Applicabile";
      default:
        return "Da Valutare";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "implemented":
        return <Badge className="bg-success text-success-foreground">Implementato</Badge>;
      case "in_progress":
        return <Badge className="bg-warning text-warning-foreground">Parzialmente Implementato</Badge>;
      case "not_implemented":
        return <Badge variant="destructive">Non Implementato</Badge>;
      case "not_applicable":
        return <Badge variant="outline">Non Applicabile</Badge>;
      default:
        return <Badge variant="outline">Da Valutare</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!control) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/controls")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Torna ai controlli
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Controllo non trovato</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/controls")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Torna ai controlli
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="font-mono text-lg px-3 py-1">
                  {control.control_id}
                </Badge>
                {getStatusBadge(control.status)}
              </div>
              <CardTitle className="text-2xl">{control.title}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Dominio: <strong>{control.domain}</strong></span>
                {control.responsible && (
                  <span>Responsabile: <strong>{control.responsible}</strong></span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-2">Obiettivo</h3>
            <p className="text-muted-foreground">{control.objective}</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stato</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona stato" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="not_implemented">Non Implementato</SelectItem>
                        <SelectItem value="in_progress">Parzialmente Implementato</SelectItem>
                        <SelectItem value="implemented">Implementato</SelectItem>
                        <SelectItem value="not_applicable">Non Applicabile</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="responsible"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsabile</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome del responsabile" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="implementation_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note di Implementazione</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Inserisci note di implementazione"
                        className="min-h-[120px]"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Salvataggio..." : "Salva"}
              </Button>
            </form>
          </Form>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Data creazione</p>
              <p className="font-medium">
                {new Date(control.created_at).toLocaleDateString("it-IT")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ultimo aggiornamento</p>
              <p className="font-medium">
                {new Date(control.updated_at).toLocaleDateString("it-IT")}
              </p>
            </div>
            {control.last_verification_date && (
              <div>
                <p className="text-sm text-muted-foreground">Ultima verifica</p>
                <p className="font-medium">
                  {new Date(control.last_verification_date).toLocaleDateString("it-IT")}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
