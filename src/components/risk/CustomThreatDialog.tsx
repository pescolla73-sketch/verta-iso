import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

export function CustomThreatDialog({ open, onOpenChange, onThreatCreated }: CustomThreatDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [nis2Type, setNis2Type] = useState("");
  const [selectedControls, setSelectedControls] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [controlSearch, setControlSearch] = useState("");

  const queryClient = useQueryClient();

  const { data: assets = [] } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("assets").select("*").order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const createThreatMutation = useMutation({
    mutationFn: async () => {
      const threatId = `CT-${Date.now()}`;
      
      console.log('🔍 Creating custom threat:', {
        threatId,
        name,
        description: description.substring(0, 50) + '...',
        category,
        nis2Type,
        selectedControls,
      });
      
      const insertData = {
        threat_id: threatId,
        name,
        description,
        category,
        nis2_incident_type: nis2Type === "not_applicable" ? null : nis2Type,
        iso27001_controls: selectedControls.length > 0 ? selectedControls : null,
        is_custom: true,
      };
      
      console.log('📝 Insert data:', insertData);

      const { data, error } = await supabase
        .from("threat_library")
        .insert(insertData)
        .select()
        .single();

      console.log('✅ Insert result:', data);
      console.log('❌ Insert error:', error);

      if (error) {
        console.error('💥 Full error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      return data;
    },
    onSuccess: (data) => {
      console.log('✅ Threat created successfully, ID:', data.id);
      console.log('🔄 Invalidating threat_library queries...');
      
      queryClient.invalidateQueries({ queryKey: ["threat-library"] });
      queryClient.invalidateQueries({ queryKey: ["threat_library"] });
      
      toast.success("✅ Minaccia personalizzata creata!", {
        description: "Puoi ora valutarla su asset specifici"
      });
      
      resetForm();
      onOpenChange(false);
      
      if (onThreatCreated) {
        console.log('🎯 Triggering onThreatCreated callback');
        onThreatCreated(data.id);
      }
    },
    onError: (error: any) => {
      console.error('💥 Mutation failed:', error);
      toast.error("❌ Errore nella creazione", {
        description: error.message || 'Dettagli in console',
        action: {
          label: 'Log',
          onClick: () => console.error('Full error:', error)
        }
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

    createThreatMutation.mutate();
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
            ✍️ Crea Nuova Minaccia Personalizzata
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
            Crea una minaccia personalizzata specifica per la tua organizzazione
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

          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              Dopo aver creato la minaccia, potrai immediatamente valutarla su asset specifici
            </AlertDescription>
          </Alert>

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
            <Button type="submit" disabled={createThreatMutation.isPending}>
              💾 Salva & Valuta Rischio
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
