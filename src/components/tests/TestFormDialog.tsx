import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { addDays, format } from "date-fns";
import { Loader2, Lightbulb, Shield, Database, AlertTriangle } from "lucide-react";
import { AutoCombobox } from "@/components/ui/auto-combobox";

interface TestFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  test?: any;
}

// Predefined test templates based on asset configuration
const getSmartTestSuggestions = (asset: any) => {
  const suggestions: { name: string; type: string; description: string; frequency: number }[] = [];
  
  if (asset?.backup_enabled) {
    suggestions.push({
      name: `Test ripristino Backup - ${asset.name}`,
      type: "Prova ripristino Backup",
      description: "Verifica periodica della capacità di ripristino dei dati dal backup",
      frequency: 90,
    });
  }
  
  if (asset?.antivirus_installed) {
    suggestions.push({
      name: `Verifica Antivirus - ${asset.name}`,
      type: "Verifica Antivirus",
      description: "Controllo aggiornamenti e scansione completa antivirus",
      frequency: 30,
    });
  }
  
  if (asset?.asset_type?.toLowerCase().includes("ups") || asset?.name?.toLowerCase().includes("ups")) {
    suggestions.push({
      name: `Test autonomia UPS - ${asset.name}`,
      type: "Test UPS",
      description: "Verifica autonomia e capacità di commutazione UPS",
      frequency: 180,
    });
  }
  
  if (asset?.asset_type?.toLowerCase().includes("server") || asset?.name?.toLowerCase().includes("server")) {
    suggestions.push({
      name: `Controllo log sicurezza - ${asset.name}`,
      type: "Audit Log",
      description: "Revisione log di sicurezza e accessi",
      frequency: 30,
    });
  }
  
  return suggestions;
};

const TestFormDialog: React.FC<TestFormDialogProps> = ({ open, onOpenChange, test }) => {
  const queryClient = useQueryClient();
  const isEditing = !!test;

  const [formData, setFormData] = useState({
    test_name: "",
    test_type: "",
    asset_id: "",
    description: "",
    frequency_days: 30,
    responsible_person: "",
    responsible_role_id: "",
    instructions: "",
  });

  const [smartSuggestions, setSmartSuggestions] = useState<ReturnType<typeof getSmartTestSuggestions>>([]);

  // Fetch assets with configuration details
  const { data: assets = [] } = useQuery({
    queryKey: ["assets-list-detailed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("id, name, asset_id, asset_type, backup_enabled, antivirus_installed, criticality")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch roles/mansioni
  const { data: roles = [] } = useQuery({
    queryKey: ["roles-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roles")
        .select("id, role_name, role_code, description")
        .order("role_name");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch test type suggestions
  const { data: testTypeSuggestionsData = [] } = useQuery({
    queryKey: ["test-type-suggestions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_type_suggestions")
        .select("test_type, usage_count")
        .order("usage_count", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch organization
  const { data: organization } = useQuery({
    queryKey: ["organization"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization")
        .select("id")
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Update smart suggestions when asset changes
  useEffect(() => {
    if (formData.asset_id) {
      const selectedAsset = assets.find((a: any) => a.id === formData.asset_id);
      if (selectedAsset) {
        setSmartSuggestions(getSmartTestSuggestions(selectedAsset));
      }
    } else {
      setSmartSuggestions([]);
    }
  }, [formData.asset_id, assets]);

  useEffect(() => {
    if (test) {
      setFormData({
        test_name: test.test_name || "",
        test_type: test.test_type || "",
        asset_id: test.asset_id || "",
        description: test.description || "",
        frequency_days: test.frequency_days || 30,
        responsible_person: test.responsible_person || "",
        responsible_role_id: test.responsible_role_id || "",
        instructions: test.instructions || "",
      });
    } else {
      setFormData({
        test_name: "",
        test_type: "",
        asset_id: "",
        description: "",
        frequency_days: 30,
        responsible_person: "",
        responsible_role_id: "",
        instructions: "",
      });
    }
  }, [test, open]);

  // Get all type suggestions
  const allTypeSuggestions = [
    ...testTypeSuggestionsData.map((s: any) => s.test_type),
    "Prova ripristino Backup",
    "Verifica Antivirus",
    "Test UPS",
    "Audit Log",
    "Vulnerability Scan",
    "Penetration Test",
    "Business Continuity Test",
    "Disaster Recovery Test",
  ].filter((value, index, self) => self.indexOf(value) === index);

  // Save test type suggestion
  const saveTypeSuggestion = async (testType: string) => {
    const existing = testTypeSuggestionsData.find(
      (s: any) => s.test_type.toLowerCase() === testType.toLowerCase()
    );

    if (existing) {
      await supabase
        .from("test_type_suggestions")
        .update({ usage_count: (existing as any).usage_count + 1, updated_at: new Date().toISOString() })
        .eq("test_type", testType);
    } else {
      await supabase.from("test_type_suggestions").insert({
        test_type: testType,
        organization_id: organization?.id,
        usage_count: 1,
      });
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const nextDueDate = addDays(new Date(), data.frequency_days);

      const payload: any = {
        test_name: data.test_name,
        test_type: data.test_type,
        description: data.description,
        frequency_days: data.frequency_days,
        responsible_person: data.responsible_person,
        instructions: data.instructions,
        organization_id: organization?.id,
        asset_id: data.asset_id || null,
        responsible_role_id: data.responsible_role_id || null,
        next_due_date: format(nextDueDate, "yyyy-MM-dd"),
        updated_at: new Date().toISOString(),
      };

      if (isEditing) {
        const { error } = await supabase
          .from("asset_tests")
          .update(payload)
          .eq("id", test.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("asset_tests").insert(payload);
        if (error) throw error;
      }

      // Save type suggestion
      await saveTypeSuggestion(data.test_type);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-tests"] });
      queryClient.invalidateQueries({ queryKey: ["test-type-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["scheduler-tests"] });
      toast.success(isEditing ? "Test aggiornato con successo" : "Test creato con successo");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error("Errore: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.test_name || !formData.test_type) {
      toast.error("Compila tutti i campi obbligatori");
      return;
    }
    mutation.mutate(formData);
  };

  const applySuggestion = (suggestion: ReturnType<typeof getSmartTestSuggestions>[0]) => {
    setFormData({
      ...formData,
      test_name: suggestion.name,
      test_type: suggestion.type,
      description: suggestion.description,
      frequency_days: suggestion.frequency,
    });
    toast.success("Suggerimento applicato!");
  };

  const frequencyOptions = [
    { value: 7, label: "Settimanale (7 giorni)" },
    { value: 14, label: "Bisettimanale (14 giorni)" },
    { value: 30, label: "Mensile (30 giorni)" },
    { value: 90, label: "Trimestrale (90 giorni)" },
    { value: 180, label: "Semestrale (180 giorni)" },
    { value: 365, label: "Annuale (365 giorni)" },
  ];

  const selectedAsset = assets.find((a: any) => a.id === formData.asset_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifica Test" : "Nuovo Test Periodico"}</DialogTitle>
          <DialogDescription>
            Configura un test ricorrente da eseguire periodicamente sull'asset selezionato
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Asset Selection with Config Info */}
          <div className="space-y-2">
            <Label htmlFor="asset_id">Asset Coinvolto</Label>
            <Select
              value={formData.asset_id}
              onValueChange={(value) => setFormData({ ...formData, asset_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleziona asset (opzionale)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nessun asset specifico</SelectItem>
                {assets.map((asset: any) => (
                  <SelectItem key={asset.id} value={asset.id}>
                    <div className="flex items-center gap-2">
                      {asset.name} ({asset.asset_id})
                      {asset.criticality?.toLowerCase() === "critical" && (
                        <Badge variant="destructive" className="text-xs">Critico</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Asset Config Summary */}
          {selectedAsset && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={selectedAsset.backup_enabled ? "default" : "secondary"} className="gap-1">
                    <Database className="h-3 w-3" />
                    Backup: {selectedAsset.backup_enabled ? "Sì" : "No"}
                  </Badge>
                  <Badge variant={selectedAsset.antivirus_installed ? "default" : "secondary"} className="gap-1">
                    <Shield className="h-3 w-3" />
                    Antivirus: {selectedAsset.antivirus_installed ? "Sì" : "No"}
                  </Badge>
                  {selectedAsset.criticality && (
                    <Badge variant="outline">Criticità: {selectedAsset.criticality}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Smart Suggestions */}
          {smartSuggestions.length > 0 && !isEditing && (
            <Alert className="border-primary/50 bg-primary/5">
              <Lightbulb className="h-4 w-4 text-primary" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Test suggeriti per questo asset:</p>
                  <div className="flex flex-wrap gap-2">
                    {smartSuggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => applySuggestion(suggestion)}
                        className="text-xs"
                      >
                        {suggestion.type}
                      </Button>
                    ))}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="test_name">Nome Test *</Label>
              <Input
                id="test_name"
                value={formData.test_name}
                onChange={(e) => setFormData({ ...formData, test_name: e.target.value })}
                placeholder="Es. Prova ripristino backup server"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="test_type">Tipo Test *</Label>
              <AutoCombobox
                value={formData.test_type}
                onValueChange={(value) => setFormData({ ...formData, test_type: value })}
                suggestions={allTypeSuggestions}
                placeholder="Seleziona o digita tipo..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="frequency_days">Frequenza</Label>
              <Select
                value={formData.frequency_days.toString()}
                onValueChange={(value) => setFormData({ ...formData, frequency_days: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {frequencyOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value.toString()}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsible_role_id">Mansione Responsabile</Label>
              <Select
                value={formData.responsible_role_id}
                onValueChange={(value) => setFormData({ ...formData, responsible_role_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona mansione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nessuna mansione</SelectItem>
                  {roles.map((role: any) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.role_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsible_person">Responsabile Esecuzione (opzionale)</Label>
            <Input
              id="responsible_person"
              value={formData.responsible_person}
              onChange={(e) => setFormData({ ...formData, responsible_person: e.target.value })}
              placeholder="Nome del responsabile"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrizione</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrivi lo scopo del test"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Istruzioni di Esecuzione</Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="Passi da seguire per eseguire il test..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? "Salva Modifiche" : "Crea Test"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TestFormDialog;
