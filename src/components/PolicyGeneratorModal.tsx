import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wand2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const POLICY_TYPES = [
  { value: "information_security", label: "Politica di Sicurezza delle Informazioni" },
  { value: "access_control", label: "Politica di Controllo degli Accessi" },
  { value: "backup", label: "Politica di Backup" },
  { value: "incident_response", label: "Politica di Risposta agli Incidenti" },
  { value: "acceptable_use", label: "Politica di Uso Accettabile" },
];

interface PolicyGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPolicyGenerated: () => void;
}

export default function PolicyGeneratorModal({ 
  open, 
  onOpenChange,
  onPolicyGenerated 
}: PolicyGeneratorModalProps) {
  const [selectedPolicy, setSelectedPolicy] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [sector, setSector] = useState("");
  const [ciso, setCiso] = useState("");
  const [dpo, setDpo] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!selectedPolicy || !organizationName) {
      toast.error("Seleziona un tipo di politica e inserisci il nome dell'organizzazione");
      return;
    }

    setIsGenerating(true);
    try {
      const { data: controls } = await supabase
        .from("controls")
        .select("control_id, status")
        .eq("status", "implemented");

      const { data: assets } = await supabase
        .from("assets")
        .select("name")
        .eq("criticality", "high")
        .limit(5);

      const organizationData = {
        name: organizationName,
        sector,
        ciso,
        dpo,
        criticalAssets: assets?.map(a => a.name) || [],
        implementedControls: controls?.length || 0,
      };

      const { data, error } = await supabase.functions.invoke("generate-policy", {
        body: { 
          policyType: POLICY_TYPES.find(p => p.value === selectedPolicy)?.label,
          organizationData 
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const policyLabel = POLICY_TYPES.find(p => p.value === selectedPolicy)?.label || "Nuova Politica";
      
      const { error: saveError } = await supabase
        .from("policies")
        .insert({
          policy_name: policyLabel,
          policy_type: selectedPolicy,
          content: data.content,
          status: "draft",
          version: "1.0",
        });

      if (saveError) throw saveError;

      toast.success("Politica generata e salvata come bozza!");
      onOpenChange(false);
      onPolicyGenerated();
      
      // Reset form
      setSelectedPolicy("");
      setOrganizationName("");
      setSector("");
      setCiso("");
      setDpo("");
    } catch (error: any) {
      console.error("Error generating policy:", error);
      toast.error(error.message || "Errore nella generazione della politica");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Genera Nuova Politica</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="policyType">Tipo di Politica</Label>
            <Select value={selectedPolicy} onValueChange={setSelectedPolicy}>
              <SelectTrigger id="policyType">
                <SelectValue placeholder="Seleziona tipo di politica" />
              </SelectTrigger>
              <SelectContent>
                {POLICY_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="orgName">Nome Organizzazione *</Label>
            <Input
              id="orgName"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="Es: Acme Corporation S.p.A."
            />
          </div>

          <div>
            <Label htmlFor="sector">Settore</Label>
            <Input
              id="sector"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              placeholder="Es: Tecnologia, Sanità, Finanza"
            />
          </div>

          <div>
            <Label htmlFor="ciso">CISO</Label>
            <Input
              id="ciso"
              value={ciso}
              onChange={(e) => setCiso(e.target.value)}
              placeholder="Nome del Chief Information Security Officer"
            />
          </div>

          <div>
            <Label htmlFor="dpo">DPO</Label>
            <Input
              id="dpo"
              value={dpo}
              onChange={(e) => setDpo(e.target.value)}
              placeholder="Nome del Data Protection Officer"
            />
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !selectedPolicy || !organizationName}
            className="w-full gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generazione in corso...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Genera Politica
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
