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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, BookOpen, CheckCircle2, FileText, AlertTriangle, Upload, Download, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useRef } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

type ControlFormData = {
  status: string;
  implementation_notes: string;
  responsible: string;
  justification: string;
};

export default function ControlDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [evidenceToDelete, setEvidenceToDelete] = useState<string | null>(null);

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

  const { data: evidences, isLoading: loadingEvidences } = useQuery({
    queryKey: ["evidences", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evidences")
        .select("*")
        .eq("control_id", id)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error loading evidences:", error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!id,
  });

  const form = useForm<ControlFormData>({
    defaultValues: {
      status: control?.status || "not_implemented",
      implementation_notes: control?.implementation_notes || "",
      responsible: control?.responsible || "",
      justification: control?.justification || "",
    },
    values: control ? {
      status: control.status,
      implementation_notes: control.implementation_notes || "",
      responsible: control.responsible || "",
      justification: control.justification || "",
    } : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ControlFormData) => {
      console.log("Updating control with data:", data);
      
      // Validate justification for not_applicable status
      if (data.status === "not_applicable" && (!data.justification || data.justification.trim().length < 20)) {
        throw new Error("Giustificazione obbligatoria per controlli Non Applicabili (minimo 20 caratteri)");
      }
      
      const { data: result, error } = await supabase
        .from("controls")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      
      if (error) {
        console.error("Update error:", error);
        throw error;
      }
      
      console.log("Update successful:", result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["control", id] });
      queryClient.invalidateQueries({ queryKey: ["controls"] });
      toast.success("Controllo aggiornato con successo");
    },
    onError: (error: any) => {
      console.error("Mutation error:", error);
      toast.error(error.message || "Errore nell'aggiornamento del controllo");
    },
  });

  const onSubmit = (data: ControlFormData) => {
    updateMutation.mutate(data);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'message/rfc822', 'application/vnd.ms-outlook'];
    const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.eml', '.msg'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      toast.error("Tipo di file non supportato. Usa: PDF, PNG, JPG, JPEG, EML, MSG");
      return;
    }

    setUploadingFile(true);

    try {
      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('evidences')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('evidences')
        .getPublicUrl(filePath);

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('evidences')
        .insert({
          control_id: id,
          title: file.name,
          file_name: file.name,
          file_type: file.type,
          file_url: publicUrl,
          description: `Uploaded evidence for control ${control?.control_id}`,
        });

      if (dbError) throw dbError;

      toast.success("Evidenza caricata con successo");
      queryClient.invalidateQueries({ queryKey: ["evidences", id] });
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Errore nel caricamento del file");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Download avviato");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Errore nel download del file");
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (evidenceId: string) => {
      // Get evidence details first
      const { data: evidence } = await supabase
        .from('evidences')
        .select('file_url')
        .eq('id', evidenceId)
        .single();

      if (evidence?.file_url) {
        // Extract file path from URL
        const url = new URL(evidence.file_url);
        const pathParts = url.pathname.split('/');
        const filePath = pathParts[pathParts.length - 1];

        // Delete from storage
        await supabase.storage
          .from('evidences')
          .remove([filePath]);
      }

      // Delete from database
      const { error } = await supabase
        .from('evidences')
        .delete()
        .eq('id', evidenceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evidences", id] });
      toast.success("Evidenza eliminata");
      setEvidenceToDelete(null);
    },
    onError: (error: any) => {
      console.error("Delete error:", error);
      toast.error("Errore nell'eliminazione");
      setEvidenceToDelete(null);
    },
  });

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "implemented":
        return "Implementato";
      case "partial":
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
      case "partial":
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
                    <Select 
                      onValueChange={(value) => {
                        console.log("Status selected:", value);
                        field.onChange(value);
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona stato" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="not_implemented">Non Implementato</SelectItem>
                        <SelectItem value="partial">Parzialmente Implementato</SelectItem>
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

              {form.watch("status") === "not_applicable" && (
                <FormField
                  control={form.control}
                  name="justification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        Giustificazione Obbligatoria
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Spiega perché questo controllo non è applicabile all'organizzazione (minimo 20 caratteri)&#10;&#10;Esempi:&#10;• L'azienda non ha fornitori IT esterni&#10;• Non gestiamo data center fisici&#10;• Tutte le infrastrutture sono in cloud"
                          className="min-h-[150px]"
                        />
                      </FormControl>
                      <p className="text-sm text-muted-foreground">
                        {field.value?.length || 0} / 20 caratteri (minimo richiesto)
                      </p>
                      {field.value && field.value.trim().length < 20 && (
                        <p className="text-sm text-destructive">
                          ⚠️ La giustificazione deve essere di almeno 20 caratteri
                        </p>
                      )}
                    </FormItem>
                  )}
                />
              )}

              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Salvataggio..." : "Salva"}
              </Button>
            </form>
          </Form>

          {/* Evidences Section */}
          <div className="pt-6 border-t">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Evidenze
              </h3>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.eml,.msg"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                  size="sm"
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {uploadingFile ? "Caricamento..." : "Carica Evidenza"}
                </Button>
              </div>
            </div>

            {loadingEvidences ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : evidences && evidences.length > 0 ? (
              <div className="space-y-2">
                {evidences.map((evidence) => (
                  <Card key={evidence.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{evidence.file_name}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{new Date(evidence.created_at).toLocaleDateString("it-IT")}</span>
                          <span>{evidence.file_type}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(evidence.file_url || '', evidence.file_name || '')}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setEvidenceToDelete(evidence.id)}
                          className="gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Elimina
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nessuna evidenza caricata. Clicca "Carica Evidenza" per aggiungerne una.
              </p>
            )}
          </div>

          {(control.guida_significato || control.guida_implementazione || control.guida_evidenze || control.guida_errori) && (
            <div className="pt-6 border-t">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="guida">
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Guida all'implementazione
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-6 pt-4">
                      {control.guida_significato && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <BookOpen className="h-4 w-4 text-primary" />
                            <h4 className="font-semibold text-base">Cosa significa</h4>
                          </div>
                          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                            {control.guida_significato}
                          </p>
                        </div>
                      )}

                      {control.guida_implementazione && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 className="h-4 w-4 text-success" />
                            <h4 className="font-semibold text-base">Come implementarlo</h4>
                          </div>
                          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                            {control.guida_implementazione}
                          </p>
                        </div>
                      )}

                      {control.guida_evidenze && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <FileText className="h-4 w-4 text-info" />
                            <h4 className="font-semibold text-base">Evidenze da caricare</h4>
                          </div>
                          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                            {control.guida_evidenze}
                          </p>
                        </div>
                      )}

                      {control.guida_errori && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="h-4 w-4 text-warning" />
                            <h4 className="font-semibold text-base">Errori comuni</h4>
                          </div>
                          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                            {control.guida_errori}
                          </p>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!evidenceToDelete} onOpenChange={() => setEvidenceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questa evidenza? Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => evidenceToDelete && deleteMutation.mutate(evidenceToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
