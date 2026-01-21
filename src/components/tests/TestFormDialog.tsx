import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { addDays, format } from "date-fns";
import { Loader2 } from "lucide-react";

interface TestFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  test?: any;
}

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
    instructions: "",
  });

  const [typeSuggestions, setTypeSuggestions] = useState<string[]>([]);
  const [showTypeSuggestions, setShowTypeSuggestions] = useState(false);

  // Fetch assets
  const { data: assets = [] } = useQuery({
    queryKey: ["assets-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("id, name, asset_id, asset_type")
        .order("name");
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

  useEffect(() => {
    if (test) {
      setFormData({
        test_name: test.test_name || "",
        test_type: test.test_type || "",
        asset_id: test.asset_id || "",
        description: test.description || "",
        frequency_days: test.frequency_days || 30,
        responsible_person: test.responsible_person || "",
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
        instructions: "",
      });
    }
  }, [test, open]);

  // Filter type suggestions based on input
  useEffect(() => {
    if (formData.test_type.length > 0) {
      const filtered = testTypeSuggestionsData
        .map((s: any) => s.test_type)
        .filter((t: string) => t.toLowerCase().includes(formData.test_type.toLowerCase()));
      setTypeSuggestions(filtered);
    } else {
      setTypeSuggestions(testTypeSuggestionsData.map((s: any) => s.test_type));
    }
  }, [formData.test_type, testTypeSuggestionsData]);

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

      const payload = {
        ...data,
        organization_id: organization?.id,
        asset_id: data.asset_id || null,
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

  const frequencyOptions = [
    { value: 7, label: "Settimanale (7 giorni)" },
    { value: 14, label: "Bisettimanale (14 giorni)" },
    { value: 30, label: "Mensile (30 giorni)" },
    { value: 90, label: "Trimestrale (90 giorni)" },
    { value: 180, label: "Semestrale (180 giorni)" },
    { value: 365, label: "Annuale (365 giorni)" },
  ];

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

            <div className="space-y-2 relative">
              <Label htmlFor="test_type">Tipo Test *</Label>
              <Input
                id="test_type"
                value={formData.test_type}
                onChange={(e) => setFormData({ ...formData, test_type: e.target.value })}
                onFocus={() => setShowTypeSuggestions(true)}
                onBlur={() => setTimeout(() => setShowTypeSuggestions(false), 200)}
                placeholder="Es. Prova ripristino Backup"
              />
              {showTypeSuggestions && typeSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {typeSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-accent text-sm"
                      onClick={() => {
                        setFormData({ ...formData, test_type: suggestion });
                        setShowTypeSuggestions(false);
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                      {asset.name} ({asset.asset_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsible_person">Responsabile Esecuzione</Label>
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
