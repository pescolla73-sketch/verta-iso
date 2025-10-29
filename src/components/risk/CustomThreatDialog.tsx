import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, X } from "lucide-react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CustomThreatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onThreatCreated?: (threatId: string) => void;
  initialData?: any;
}

const THREAT_CATEGORIES = [
  { value: "Natural/Environmental", label: "🔥 Natural/Environmental", description: "(Incendi, alluvioni, terremoti)" },
  { value: "Cyber/Technical", label: "💻 Cyber/Technical", description: "(Malware, hacking, vulnerabilità)" },
  { value: "Hardware/Infrastructure", label: "🏗️ Hardware/Infrastructure", description: "(Guasti hardware, rete, utilities)" },
  { value: "Human", label: "👤 Human", description: "(Errore umano, sabotaggio)" },
  { value: "Organizational", label: "🏢 Organizational", description: "(Fornitori, processi, gestione)" },
  { value: "Legal/Compliance", label: "⚖️ Legal/Compliance", description: "(Normative, contratti, sanzioni)" },
];

const NIS2_INCIDENT_TYPES = [
  { value: "availability_disruption", label: "Availability disruption" },
  { value: "confidentiality_breach", label: "Confidentiality breach" },
  { value: "integrity_compromise", label: "Integrity compromise" },
  { value: "not_applicable", label: "Non applicabile" },
];

const ISO_CONTROLS_SUGGESTIONS = [
  "5.1", "5.7", "5.10", "5.14", "5.23", "5.30",
  "6.1", "6.2", "6.3", "6.5", "6.8",
  "7.1", "7.2", "7.3", "7.4", "7.5", "7.7", "7.8", "7.10", "7.11", "7.14",
  "8.1", "8.2", "8.3", "8.5", "8.6", "8.7", "8.8", "8.9", "8.10", "8.11", "8.12", "8.14", "8.16", "8.19", "8.23", "8.28",
];

export function CustomThreatDialog({ open, onOpenChange, onThreatCreated, initialData }: CustomThreatDialogProps) {
  const isEditMode = !!initialData;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [nis2Type, setNis2Type] = useState("");
  const [selectedControls, setSelectedControls] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [controlSearch, setControlSearch] = useState("");

  const queryClient = useQueryClient();

  // Pre-fill form when editing
  useEffect(() => {
    if (initialData && open) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setCategory(initialData.category || "");
      setNis2Type(initialData.nis2_incident_type || "");
      setSelectedControls(initialData.iso27001_controls || []);
      setNotes(initialData.notes || "");
    } else if (!open) {
      resetForm();
    }
  }, [initialData, open]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      console.log(isEditMode ? '🔍 Updating custom threat:' : '🔍 Creating custom threat:', { name, category });
      
      const threatData = {
        name,
        description,
        category,
        nis2_incident_type: nis2Type === "not_applicable" ? null : nis2Type,
        iso27001_controls: selectedControls.length > 0 ? selectedControls : null,
        updated_at: new Date().toISOString()
      };

      if (isEditMode) {
        // Update existing threat
        const { data, error } = await supabase
          .from("threat_library")
          .update(threatData)
          .eq("id", initialData.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new threat
        const newThreatData = {
          ...threatData,
          threat_id: `CT-${Date.now()}`,
          is_custom: true,
          created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from("threat_library")
          .insert(newThreatData)
          .select()
          .single();

        console.log('✅ Insert result:', data);

        if (error) {
          console.error('💥 Full error details:', error);
          throw error;
        }

        return data;
      }
    },
    onSuccess: (data) => {
      console.log(isEditMode ? '✅ Threat updated' : '✅ Threat created successfully, ID:', data.id);
      
      queryClient.invalidateQueries({ queryKey: ["threat-library"] });
      queryClient.invalidateQueries({ queryKey: ["threat_library"] });
      
      toast.success(isEditMode ? '✅ Minaccia aggiornata!' : '✅ Minaccia personalizzata creata!', {
        description: isEditMode ? 'Le modifiche sono state salvate' : 'La nuova minaccia è ora disponibile nella libreria'
      });
      
      setTimeout(() => {
        resetForm();
        if (onThreatCreated) {
          onThreatCreated(data.threat_id || data.id);
        }
        onOpenChange(false);
      }, 100);
    },
    onError: (error: any) => {
      console.error('💥 Mutation failed:', error);
      
      let errorMessage = "Dettagli in console";
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.status === 406) {
        errorMessage = "Errore 406: Verifica le policy RLS nel database";
      }
      
      toast.error(`❌ Errore ${isEditMode ? "nell'aggiornamento" : "nella creazione"}`, {
        description: errorMessage,
        duration: 5000
      });
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setCategory("");
    setNis2Type("");
    setSelectedControls([]);
    setNotes("");
    setControlSearch("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !description.trim() || !category) {
      toast.error("Compila tutti i campi obbligatori");
      return;
    }

    saveMutation.mutate();
  };

  const toggleControl = (control: string) => {
    setSelectedControls(prev =>
      prev.includes(control) ? prev.filter(c => c !== control) : [...prev, control]
    );
  };

  const filteredControls = ISO_CONTROLS_SUGGESTIONS.filter(control =>
    control.toLowerCase().includes(controlSearch.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditMode ? '✏️ Modifica Minaccia' : '✍️ Crea Nuova Minaccia Personalizzata'}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <InfoIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-medium">Istruzioni di Compilazione</h4>
                  <ul className="text-sm space-y-1 list-disc pl-4">
                    <li>Descrivi minacce specifiche per la tua organizzazione</li>
                    <li>Sii dettagliato negli scenari di impatto</li>
                    <li>Seleziona la categoria più appropriata</li>
                    <li>Collega ai controlli ISO 27001 pertinenti</li>
                  </ul>
                </div>
              </PopoverContent>
            </Popover>
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Modifica i dettagli della minaccia personalizzata' 
              : 'Crea una minaccia personalizzata specifica per la tua organizzazione'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              Nome Minaccia *
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-4 w-4 p-0">
                    <InfoIcon className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <p className="text-sm">Esempio: "Guasto sistema climatizzazione server room"</p>
                </PopoverContent>
              </Popover>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="es: Guasto sistema climatizzazione"
              required
            />
            <p className="text-xs text-muted-foreground">💡 Sii specifico e descrittivo</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrizione Dettagliata *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Il sistema di raffreddamento del server room si guasta causando surriscaldamento e shutdown dei server per protezione."
              rows={6}
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Categoria Minaccia *</Label>
            <RadioGroup value={category} onValueChange={setCategory}>
              {THREAT_CATEGORIES.map((cat) => (
                <div key={cat.value} className="flex items-start space-x-2">
                  <RadioGroupItem value={cat.value} id={cat.value} />
                  <Label htmlFor={cat.value} className="cursor-pointer font-normal">
                    <div>{cat.label}</div>
                    <div className="text-xs text-muted-foreground">{cat.description}</div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label>Tipo Incidente NIS2 (se applicabile)</Label>
            <RadioGroup value={nis2Type} onValueChange={setNis2Type}>
              {NIS2_INCIDENT_TYPES.map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={type.value} id={type.value} />
                  <Label htmlFor={type.value} className="cursor-pointer font-normal">
                    {type.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label>Controlli ISO 27001 Raccomandati (opzionale)</Label>
            <Input
              placeholder="Cerca controllo... 🔍"
              value={controlSearch}
              onChange={(e) => setControlSearch(e.target.value)}
            />
            <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
              {filteredControls.map((control) => (
                <div key={control} className="flex items-center space-x-2">
                  <Checkbox
                    id={`control-${control}`}
                    checked={selectedControls.includes(control)}
                    onCheckedChange={() => toggleControl(control)}
                  />
                  <Label htmlFor={`control-${control}`} className="cursor-pointer font-normal">
                    {control}
                  </Label>
                </div>
              ))}
            </div>
            {selectedControls.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Selezionati:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedControls.map((control) => (
                    <Badge key={control} variant="secondary">
                      {control}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 ml-1 p-0"
                        onClick={() => toggleControl(control)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Note Aggiuntive</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Aggiungi contesto specifico per la tua organizzazione..."
              rows={3}
            />
          </div>

          {!isEditMode && (
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                Dopo aver creato la minaccia, potrai immediatamente valutarla su asset specifici
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              ❌ Annulla
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending 
                ? '💾 Salvataggio...' 
                : isEditMode 
                  ? '💾 Salva Modifiche' 
                  : '💾 Salva & Valuta Rischio'
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
