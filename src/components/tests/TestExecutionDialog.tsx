import React, { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2, Upload, X, FileText, Image, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface TestExecutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  test: any;
}

interface UploadedFile {
  name: string;
  url: string;
  type: string;
}

const TestExecutionDialog: React.FC<TestExecutionDialogProps> = ({ open, onOpenChange, test }) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    execution_date: format(new Date(), "yyyy-MM-dd"),
    executed_by: "",
    result: "passed" as "passed" | "failed" | "partial",
    notes: "",
    issues_found: "",
    corrective_actions: "",
  });

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newFiles: UploadedFile[] = [];

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${test?.id || "test"}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `evidence/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("test-evidence")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("test-evidence")
          .getPublicUrl(filePath);

        newFiles.push({
          name: file.name,
          url: urlData.publicUrl,
          type: file.type,
        });
      }

      setUploadedFiles((prev) => [...prev, ...newFiles]);
      toast.success(`${newFiles.length} file caricati con successo`);
    } catch (error: any) {
      toast.error("Errore durante il caricamento: " + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!test) throw new Error("Test non selezionato");

      const payload: any = {
        organization_id: test.organization_id,
        test_id: test.id,
        asset_id: test.asset_id || null,
        execution_date: formData.execution_date,
        executed_by: formData.executed_by,
        result: formData.result,
        notes: formData.notes || null,
        issues_found: formData.issues_found || null,
        corrective_actions: formData.corrective_actions || null,
        evidence_files: uploadedFiles,
      };

      const { error } = await supabase.from("asset_test_executions").insert(payload);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-tests"] });
      queryClient.invalidateQueries({ queryKey: ["recent-test-executions"] });
      queryClient.invalidateQueries({ queryKey: ["test-history", test?.id] });
      toast.success("Esecuzione test registrata con successo");
      onOpenChange(false);
      // Reset form
      setFormData({
        execution_date: format(new Date(), "yyyy-MM-dd"),
        executed_by: "",
        result: "passed",
        notes: "",
        issues_found: "",
        corrective_actions: "",
      });
      setUploadedFiles([]);
    },
    onError: (error: any) => {
      toast.error("Errore: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.executed_by) {
      toast.error("Inserisci il nome dell'esecutore");
      return;
    }
    mutation.mutate();
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  if (!test) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Esegui Test: {test.test_name}</DialogTitle>
          <DialogDescription>
            Registra l'esecuzione del test e carica le evidenze
          </DialogDescription>
        </DialogHeader>

        {/* Test Info Card */}
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Tipo:</span>{" "}
                <span className="font-medium">{test.test_type}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Asset:</span>{" "}
                <span className="font-medium">{test.assets?.name || "Nessuno"}</span>
              </div>
              {test.instructions && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Istruzioni:</span>
                  <p className="mt-1 text-foreground">{test.instructions}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="execution_date">Data Esecuzione *</Label>
              <Input
                id="execution_date"
                type="date"
                value={formData.execution_date}
                onChange={(e) => setFormData({ ...formData, execution_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="executed_by">Eseguito da *</Label>
              <Input
                id="executed_by"
                value={formData.executed_by}
                onChange={(e) => setFormData({ ...formData, executed_by: e.target.value })}
                placeholder="Nome e cognome"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Esito del Test *</Label>
            <RadioGroup
              value={formData.result}
              onValueChange={(value: "passed" | "failed" | "partial") =>
                setFormData({ ...formData, result: value })
              }
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="passed" id="passed" />
                <Label htmlFor="passed" className="flex items-center gap-2 cursor-pointer">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Superato
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="partial" id="partial" />
                <Label htmlFor="partial" className="flex items-center gap-2 cursor-pointer">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  Parziale
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="failed" id="failed" />
                <Label htmlFor="failed" className="flex items-center gap-2 cursor-pointer">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Fallito
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Note</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Note sull'esecuzione del test..."
              rows={2}
            />
          </div>

          {(formData.result === "failed" || formData.result === "partial") && (
            <>
              <div className="space-y-2">
                <Label htmlFor="issues_found">Problemi Riscontrati</Label>
                <Textarea
                  id="issues_found"
                  value={formData.issues_found}
                  onChange={(e) => setFormData({ ...formData, issues_found: e.target.value })}
                  placeholder="Descrivi i problemi riscontrati..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="corrective_actions">Azioni Correttive</Label>
                <Textarea
                  id="corrective_actions"
                  value={formData.corrective_actions}
                  onChange={(e) => setFormData({ ...formData, corrective_actions: e.target.value })}
                  placeholder="Azioni correttive da intraprendere..."
                  rows={2}
                />
              </div>
            </>
          )}

          {/* Evidence Upload */}
          <div className="space-y-2">
            <Label>Evidenze (Screenshot, Documenti)</Label>
            <div className="border-2 border-dashed rounded-lg p-4">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="text-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Carica Evidenze
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Immagini, PDF, documenti Office
                </p>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.type)}
                        <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          Visualizza
                        </a>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Registra Esecuzione
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TestExecutionDialog;
