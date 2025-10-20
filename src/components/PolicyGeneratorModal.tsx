import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wand2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

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
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Additional role fields based on policy type
  const [itManager, setItManager] = useState("");
  const [helpDeskManager, setHelpDeskManager] = useState("");
  const [hrManager, setHrManager] = useState("");
  const [responsabilePaghe, setResponsabilePaghe] = useState("");
  const [systemAdministrator, setSystemAdministrator] = useState("");
  const [backupOperator, setBackupOperator] = useState("");
  const [incidentResponseManager, setIncidentResponseManager] = useState("");
  const [communicationManager, setCommunicationManager] = useState("");

  // Fetch organization data
  const { data: organization } = useQuery({
    queryKey: ["organization"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Update additional fields when organization data loads
  useEffect(() => {
    if (organization) {
      setItManager(organization.it_manager || "");
      setHelpDeskManager(organization.help_desk_manager || "");
      setHrManager(organization.hr_manager || "");
      setResponsabilePaghe(organization.responsabile_paghe || "");
      setSystemAdministrator(organization.system_administrator || "");
      setBackupOperator(organization.backup_operator || "");
      setIncidentResponseManager(organization.incident_response_manager || "");
      setCommunicationManager(organization.communication_manager || "");
    }
  }, [organization]);

  // Get additional fields based on policy type
  const getAdditionalRoles = () => {
    const roles: any = {};
    
    switch (selectedPolicy) {
      case "access_control":
        if (itManager) roles.itManager = itManager;
        if (helpDeskManager) roles.helpDeskManager = helpDeskManager;
        break;
      case "backup":
        if (systemAdministrator) roles.systemAdministrator = systemAdministrator;
        if (backupOperator) roles.backupOperator = backupOperator;
        break;
      case "incident_response":
        if (incidentResponseManager) roles.incidentResponseManager = incidentResponseManager;
        if (communicationManager) roles.communicationManager = communicationManager;
        break;
      case "hr_policy":
        if (hrManager) roles.hrManager = hrManager;
        if (responsabilePaghe) roles.responsabilePaghe = responsabilePaghe;
        break;
    }
    
    return roles;
  };

  const handleGenerate = async () => {
    if (!selectedPolicy || !organization) {
      toast.error("Seleziona un tipo di politica");
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
        name: organization.name,
        sector: organization.sector,
        scope: organization.scope,
        ciso: organization.ciso,
        dpo: organization.dpo,
        ceo: organization.ceo,
        cto: organization.cto,
        ...getAdditionalRoles(),
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

      // TODO: TEMPORARY - Use default user_id for testing
      // This needs to be replaced with proper authentication:
      // const { data: { user } } = await supabase.auth.getUser();
      // For now, get the first user from profiles table as default
      const { data: defaultUser } = await supabase
        .from("profiles")
        .select("id")
        .limit(1)
        .single();

      const policyLabel = POLICY_TYPES.find(p => p.value === selectedPolicy)?.label || "Nuova Politica";
      
      const { error: saveError } = await supabase
        .from("policies")
        .insert({
          policy_name: policyLabel,
          policy_type: selectedPolicy,
          content: data.content,
          status: "draft",
          version: "1.0",
          user_id: defaultUser?.id || null, // TODO: Replace with auth.uid()
          organization_id: organization.id,
        });

      if (saveError) throw saveError;

      toast.success("Politica generata e salvata come bozza!");
      onOpenChange(false);
      onPolicyGenerated();
      
      // Reset form
      setSelectedPolicy("");
    } catch (error: any) {
      console.error("Error generating policy:", error);
      toast.error(error.message || "Errore nella generazione della politica");
    } finally {
      setIsGenerating(false);
    }
  };

  // Render additional fields based on policy type
  const renderAdditionalFields = () => {
    switch (selectedPolicy) {
      case "access_control":
        return (
          <>
            <div>
              <Label htmlFor="itManager">IT Manager</Label>
              <Input
                id="itManager"
                value={itManager}
                onChange={(e) => setItManager(e.target.value)}
                placeholder="Nome IT Manager"
              />
            </div>
            <div>
              <Label htmlFor="helpDeskManager">Help Desk Manager</Label>
              <Input
                id="helpDeskManager"
                value={helpDeskManager}
                onChange={(e) => setHelpDeskManager(e.target.value)}
                placeholder="Nome Help Desk Manager"
              />
            </div>
          </>
        );
      case "backup":
        return (
          <>
            <div>
              <Label htmlFor="systemAdministrator">System Administrator</Label>
              <Input
                id="systemAdministrator"
                value={systemAdministrator}
                onChange={(e) => setSystemAdministrator(e.target.value)}
                placeholder="Nome System Administrator"
              />
            </div>
            <div>
              <Label htmlFor="backupOperator">Backup Operator</Label>
              <Input
                id="backupOperator"
                value={backupOperator}
                onChange={(e) => setBackupOperator(e.target.value)}
                placeholder="Nome Backup Operator"
              />
            </div>
          </>
        );
      case "incident_response":
        return (
          <>
            <div>
              <Label htmlFor="incidentResponseManager">Incident Response Manager</Label>
              <Input
                id="incidentResponseManager"
                value={incidentResponseManager}
                onChange={(e) => setIncidentResponseManager(e.target.value)}
                placeholder="Nome Incident Response Manager"
              />
            </div>
            <div>
              <Label htmlFor="communicationManager">Communication Manager</Label>
              <Input
                id="communicationManager"
                value={communicationManager}
                onChange={(e) => setCommunicationManager(e.target.value)}
                placeholder="Nome Communication Manager"
              />
            </div>
          </>
        );
      case "hr_policy":
        return (
          <>
            <div>
              <Label htmlFor="hrManager">HR Manager</Label>
              <Input
                id="hrManager"
                value={hrManager}
                onChange={(e) => setHrManager(e.target.value)}
                placeholder="Nome HR Manager"
              />
            </div>
            <div>
              <Label htmlFor="responsabilePaghe">Responsabile Paghe</Label>
              <Input
                id="responsabilePaghe"
                value={responsabilePaghe}
                onChange={(e) => setResponsabilePaghe(e.target.value)}
                placeholder="Nome Responsabile Paghe"
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Genera Nuova Politica</DialogTitle>
          <DialogDescription>
            Seleziona il tipo di politica da generare. I campi organizzativi sono precompilati dal database.
          </DialogDescription>
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

          <div className="border-t pt-4">
            <p className="text-sm font-medium text-muted-foreground mb-3">
              Dati Organizzazione (dal database)
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="orgName">Nome Organizzazione</Label>
                <Input
                  id="orgName"
                  value={organization?.name || ""}
                  disabled
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
              </div>

              <div>
                <Label htmlFor="sector">Settore</Label>
                <Input
                  id="sector"
                  value={organization?.sector || ""}
                  disabled
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
              </div>

              <div>
                <Label htmlFor="scope">Ambito</Label>
                <Input
                  id="scope"
                  value={organization?.scope || ""}
                  disabled
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
              </div>

              <div>
                <Label htmlFor="ciso">CISO</Label>
                <Input
                  id="ciso"
                  value={organization?.ciso || ""}
                  disabled
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
              </div>

              <div>
                <Label htmlFor="dpo">DPO</Label>
                <Input
                  id="dpo"
                  value={organization?.dpo || ""}
                  disabled
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
              </div>

              <div>
                <Label htmlFor="ceo">CEO</Label>
                <Input
                  id="ceo"
                  value={organization?.ceo || ""}
                  disabled
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
              </div>

              <div>
                <Label htmlFor="cto">CTO</Label>
                <Input
                  id="cto"
                  value={organization?.cto || ""}
                  disabled
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {selectedPolicy && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-muted-foreground mb-3">
                Ruoli Aggiuntivi Specifici
              </p>
              <div className="grid grid-cols-2 gap-4">
                {renderAdditionalFields()}
              </div>
            </div>
          )}

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !selectedPolicy || !organization}
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
