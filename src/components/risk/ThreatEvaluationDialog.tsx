import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AlertTriangle, TrendingUp, TrendingDown, Shield, CheckCircle2, Plus, Save } from "lucide-react";
import { logAuditEvent } from "@/utils/auditLog";
import { useOrganization } from "@/hooks/useOrganization";
import { CreateTaskFromRiskDialog } from "./CreateTaskFromRiskDialog";

interface ThreatEvaluationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  threatId: string | null;
  initialRiskData?: any;
}

const PROBABILITY_LEVELS = [
  { value: 1, label: "Molto Bassa (1)", description: "<5% annuo", color: "bg-green-100 text-green-800" },
  { value: 2, label: "Bassa (2)", description: "5-25% annuo", color: "bg-green-50 text-green-700" },
  { value: 3, label: "Media (3)", description: "25-50% annuo", color: "bg-yellow-50 text-yellow-700" },
  { value: 4, label: "Alta (4)", description: "50-75% annuo", color: "bg-orange-50 text-orange-700" },
  { value: 5, label: "Molto Alta (5)", description: ">75% annuo", color: "bg-red-50 text-red-700" }
];

const IMPACT_LEVELS = [
  { value: 1, label: "Trascurabile (1)", description: "Minimo impatto" },
  { value: 2, label: "Limitato (2)", description: "Impatto gestibile" },
  { value: 3, label: "Significativo (3)", description: "Impatto rilevante" },
  { value: 4, label: "Grave (4)", description: "Impatto serio" },
  { value: 5, label: "Critico (5)", description: "Impatto catastrofico" }
];

export function ThreatEvaluationDialog({ open, onOpenChange, threatId, initialRiskData }: ThreatEvaluationDialogProps) {
  const isEditMode = !!initialRiskData;
  const [currentStep, setCurrentStep] = useState<'assessment' | 'treatment' | 'summary'>('assessment');
  const [probability, setProbability] = useState<number | null>(null);
  const [operationalImpact, setOperationalImpact] = useState<number | null>(null);
  const [economicImpact, setEconomicImpact] = useState<number | null>(null);
  const [legalImpact, setLegalImpact] = useState<number | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [selectedControls, setSelectedControls] = useState<string[]>([]);
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [treatmentCost, setTreatmentCost] = useState("");
  const [treatmentDeadline, setTreatmentDeadline] = useState("");
  const [responsible, setResponsible] = useState("");
  const [residualProbability, setResidualProbability] = useState<number | null>(null);
  const [residualImpact, setResidualImpact] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [savedRiskId, setSavedRiskId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { organizationId, isDemoMode } = useOrganization();

  // Pre-fill form when editing
  useEffect(() => {
    if (initialRiskData && open) {
      setProbability(parseInt(initialRiskData.inherent_probability) || null);
      const impact = parseInt(initialRiskData.inherent_impact) || null;
      setOperationalImpact(impact);
      setEconomicImpact(impact);
      setLegalImpact(impact);
      setSelectedAssetId(initialRiskData.asset_id || null);
      setSelectedControls(initialRiskData.related_controls || []);
      setTreatmentPlan(initialRiskData.treatment_description || "");
      setTreatmentCost(initialRiskData.treatment_cost?.toString() || "");
      setTreatmentDeadline(initialRiskData.treatment_deadline || "");
      setResponsible(initialRiskData.treatment_responsible || "");
      setResidualProbability(parseInt(initialRiskData.residual_probability) || null);
      setResidualImpact(parseInt(initialRiskData.residual_impact) || null);
    }
  }, [initialRiskData, open]);

  const { data: threat } = useQuery({
    queryKey: ["threat", threatId],
    queryFn: async () => {
      if (!threatId) return null;
      const { data, error } = await supabase
        .from("threat_library")
        .select("*")
        .eq("threat_id", threatId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!threatId && open
  });

  const { data: controls = [] } = useQuery({
    queryKey: ["controls"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("controls")
        .select("*")
        .order("control_id");
      if (error) throw error;
      return data || [];
    },
    enabled: open
  });

  // Fetch assets for dropdown
  const { data: assets = [] } = useQuery({
    queryKey: ["assets-dropdown"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("id, name, asset_id, criticality")
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: open
  });

  const maxImpact = Math.max(operationalImpact || 0, economicImpact || 0, legalImpact || 0);
  const inherentScore = (probability || 0) * maxImpact;
  const residualScore = (residualProbability || 0) * (residualImpact || 0);

  const getRiskLevel = (score: number) => {
    if (score >= 17) return { level: "Critico", color: "destructive" };
    if (score >= 13) return { level: "Alto", color: "default" };
    if (score >= 7) return { level: "Medio", color: "secondary" };
    return { level: "Basso", color: "outline" };
  };

  // Determine if we can save (minimal requirements: probability + at least one impact)
  const canSaveAssessment = probability && (operationalImpact || economicImpact || legalImpact);
  
  // Determine status based on what's filled
  const determineStatus = () => {
    if (treatmentPlan && residualProbability && residualImpact) {
      return 'In trattamento';
    }
    if (canSaveAssessment) {
      return 'Valutato';
    }
    return 'Identificato';
  };

  const handleSubmit = async (quickSave = false) => {
    if (!threat) return;

    // Validate organization_id is available
    if (!organizationId) {
      toast.error("❌ Nessuna organizzazione selezionata", {
        description: "Seleziona un'organizzazione prima di salvare il rischio"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const inherentLevel = getRiskLevel(inherentScore);
      const residualLevel = getRiskLevel(residualScore);
      const status = determineStatus();

      const riskData = {
        organization_id: organizationId,
        risk_type: 'scenario',
        name: threat.name,
        description: threat.description,
        asset_id: selectedAssetId || null,
        inherent_probability: String(probability),
        inherent_impact: String(maxImpact),
        inherent_risk_score: inherentScore,
        inherent_risk_level: inherentLevel.level,
        residual_probability: residualProbability ? String(residualProbability) : null,
        residual_impact: residualImpact ? String(residualImpact) : null,
        residual_risk_score: residualScore || null,
        residual_risk_level: residualScore ? residualLevel.level : null,
        treatment_strategy: treatmentPlan ? "Mitigazione" : null,
        treatment_description: treatmentPlan || null,
        treatment_cost: treatmentCost ? parseFloat(treatmentCost) : null,
        treatment_deadline: treatmentDeadline || null,
        treatment_responsible: responsible || null,
        related_controls: selectedControls.length > 0 ? selectedControls : null,
        scope: 'Organizzazione',
        status: status
      };

      console.log(isEditMode ? '🔍 Updating risk assessment:' : '🔍 Saving risk assessment:', riskData);
      console.log('📦 Organization ID:', organizationId, isDemoMode ? '(DEMO MODE)' : '');
      console.log('📊 Status:', status, quickSave ? '(quick save)' : '');

      let data, error;
      
      if (isEditMode) {
        // Update existing risk - don't update organization_id
        const { organization_id, ...updateData } = riskData;
        const result = await supabase
          .from("risks")
          .update(updateData)
          .eq("id", initialRiskData.id)
          .select()
          .single();
        data = result.data;
        error = result.error;
      } else {
        // Create new risk
        const result = await supabase
          .from("risks")
          .insert({
            ...riskData,
            risk_id: `RISK-${Date.now()}`
          })
          .select()
          .single();
        data = result.data;
        error = result.error;
      }

      console.log('✅ Risk save result:', data);
      console.log('❌ Risk save error:', error);

      if (error) {
        console.error('💥 Full error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      // Log audit event
      await logAuditEvent({
        action: isEditMode ? 'update' : 'create',
        entityType: 'risk',
        entityId: data.id,
        entityName: data.name,
        oldValues: isEditMode ? initialRiskData : undefined,
        newValues: riskData,
        notes: isEditMode ? 'Risk updated in assessment' : `New risk created (${status})`
      });

      console.log('🔄 Invalidating risks queries...');
      await queryClient.invalidateQueries({ queryKey: ["risks"] });
      
      // Save the risk ID for task creation
      setSavedRiskId(data.id);
      
      const statusLabel = status === 'Valutato' ? 'valutato' : status === 'In trattamento' ? 'in trattamento' : 'identificato';
      toast.success(isEditMode ? "✅ Rischio aggiornato!" : `✅ Rischio salvato come ${statusLabel}!`, {
        description: `${data.name} - ${data.inherent_risk_level}`
      });
      
      // Close dialog on quick save, otherwise stay for treatment
      if (quickSave) {
        onOpenChange(false);
        resetForm();
      }
    } catch (error: any) {
      console.error("💥 Error saving risk:", error);
      toast.error(`❌ Errore ${isEditMode ? "nell'aggiornamento" : "nel salvataggio"}`, {
        description: error.message || 'Dettagli in console',
        action: {
          label: 'Log',
          onClick: () => console.error('Full error:', error)
        }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCurrentStep('assessment');
    setProbability(null);
    setOperationalImpact(null);
    setEconomicImpact(null);
    setLegalImpact(null);
    setSelectedAssetId(null);
    setSelectedControls([]);
    setTreatmentPlan("");
    setTreatmentCost("");
    setTreatmentDeadline("");
    setResponsible("");
    setResidualProbability(null);
    setResidualImpact(null);
    setSavedRiskId(null);
  };

  const canProceedToTreatment = probability && operationalImpact && economicImpact && legalImpact;
  const canProceedToSummary = canProceedToTreatment && selectedControls.length > 0 && residualProbability && residualImpact;

  if (!threat) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            {isEditMode ? 'Modifica Rischio:' : 'Valutazione Rischio:'} {threat.name}
          </DialogTitle>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline">{threat.threat_id}</Badge>
            <Badge>{threat.category}</Badge>
            {threat.nis2_incident_type && (
              <Badge variant="secondary">{threat.nis2_incident_type}</Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {currentStep === 'assessment' && (
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-4">{threat.description}</p>
                  
                  {threat.typical_probability && threat.typical_impact && (
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Baseline tipico:</span>
                        <Badge variant="outline">P: {threat.typical_probability}/5</Badge>
                        <Badge variant="outline">I: {threat.typical_impact}/5</Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-6">
                  <div>
                    <Label className="text-base font-semibold mb-3 block">
                      Probabilità che si verifichi
                    </Label>
                    <RadioGroup
                      value={String(probability || '')}
                      onValueChange={(val) => setProbability(Number(val))}
                      className="space-y-2"
                    >
                      {PROBABILITY_LEVELS.map((level) => (
                        <div key={level.value} className="flex items-center space-x-3 p-3 rounded-lg border">
                          <RadioGroupItem value={String(level.value)} id={`prob-${level.value}`} />
                          <Label htmlFor={`prob-${level.value}`} className="flex-1 cursor-pointer">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{level.label}</span>
                              <span className="text-sm text-muted-foreground">{level.description}</span>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-base font-semibold">Impatto se si verifica (NIS2)</h3>
                    
                    <div>
                      <Label className="mb-2 block">💼 Impatto Operativo</Label>
                      <RadioGroup
                        value={String(operationalImpact || '')}
                        onValueChange={(val) => setOperationalImpact(Number(val))}
                        className="space-y-2"
                      >
                        {IMPACT_LEVELS.map((level) => (
                          <div key={level.value} className="flex items-center space-x-3 p-2 rounded border">
                            <RadioGroupItem value={String(level.value)} id={`op-${level.value}`} />
                            <Label htmlFor={`op-${level.value}`} className="flex-1 cursor-pointer text-sm">
                              {level.label} - {level.description}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <div>
                      <Label className="mb-2 block">💰 Impatto Economico</Label>
                      <RadioGroup
                        value={String(economicImpact || '')}
                        onValueChange={(val) => setEconomicImpact(Number(val))}
                        className="space-y-2"
                      >
                        {IMPACT_LEVELS.map((level) => (
                          <div key={level.value} className="flex items-center space-x-3 p-2 rounded border">
                            <RadioGroupItem value={String(level.value)} id={`ec-${level.value}`} />
                            <Label htmlFor={`ec-${level.value}`} className="flex-1 cursor-pointer text-sm">
                              {level.label} - {level.description}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <div>
                      <Label className="mb-2 block">⚖️ Impatto Legale/Reputazionale</Label>
                      <RadioGroup
                        value={String(legalImpact || '')}
                        onValueChange={(val) => setLegalImpact(Number(val))}
                        className="space-y-2"
                      >
                        {IMPACT_LEVELS.map((level) => (
                          <div key={level.value} className="flex items-center space-x-3 p-2 rounded border">
                            <RadioGroupItem value={String(level.value)} id={`leg-${level.value}`} />
                            <Label htmlFor={`leg-${level.value}`} className="flex-1 cursor-pointer text-sm">
                              {level.label} - {level.description}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  </div>

                  {/* Asset Selection */}
                  <div className="pt-4 border-t">
                    <Label className="text-base font-semibold mb-3 block">
                      Asset Collegato (opzionale)
                    </Label>
                    <Select
                      value={selectedAssetId || "none"}
                      onValueChange={(val) => setSelectedAssetId(val === "none" ? null : val)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleziona un asset..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nessun asset specifico</SelectItem>
                        {assets.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id}>
                            <span className="flex items-center gap-2">
                              <Badge variant={asset.criticality === 'critico' ? 'destructive' : 'outline'} className="text-xs">
                                {asset.asset_id}
                              </Badge>
                              {asset.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {canProceedToTreatment && (
                    <Card className="bg-accent">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold mb-1">Rischio Inerente Calcolato:</p>
                            <p className="text-sm text-muted-foreground">
                              Probabilità ({probability}) × max(Impatti) = {inherentScore}
                            </p>
                          </div>
                          <Badge variant={getRiskLevel(inherentScore).color as any} className="text-lg px-4 py-2">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            {getRiskLevel(inherentScore).level}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 'treatment' && (
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Controlli ISO 27001:2022 Raccomandati
                  </h3>
                  <div className="space-y-2">
                    {(threat.iso27001_controls || []).map((controlId: string) => {
                      const control = controls.find(c => c.control_id === controlId);
                      return (
                        <div
                          key={controlId}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedControls.includes(controlId) ? 'bg-accent border-primary' : 'hover:bg-accent'
                          }`}
                          onClick={() => {
                            setSelectedControls(prev =>
                              prev.includes(controlId)
                                ? prev.filter(id => id !== controlId)
                                : [...prev, controlId]
                            );
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedControls.includes(controlId)}
                            onChange={() => {}}
                            className="h-4 w-4"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{controlId} - {control?.title || 'Controllo'}</p>
                            {control?.objective && (
                              <p className="text-sm text-muted-foreground">{control.objective}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <Label htmlFor="treatment-plan" className="mb-2 block">Piano di Azione</Label>
                    <Textarea
                      id="treatment-plan"
                      value={treatmentPlan}
                      onChange={(e) => setTreatmentPlan(e.target.value)}
                      placeholder="Descrivi le azioni concrete per mitigare questo rischio..."
                      rows={6}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="cost">Costo (€)</Label>
                      <Input
                        id="cost"
                        type="number"
                        value={treatmentCost}
                        onChange={(e) => setTreatmentCost(e.target.value)}
                        placeholder="3500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="deadline">Deadline</Label>
                      <Input
                        id="deadline"
                        type="date"
                        value={treatmentDeadline}
                        onChange={(e) => setTreatmentDeadline(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="responsible">Responsabile</Label>
                      <Input
                        id="responsible"
                        value={responsible}
                        onChange={(e) => setResponsible(e.target.value)}
                        placeholder="IT Manager"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="font-semibold">Rischio Residuo (dopo controlli)</h3>
                  
                  <div>
                    <Label className="mb-2 block">Probabilità Residua</Label>
                    <RadioGroup
                      value={String(residualProbability || '')}
                      onValueChange={(val) => setResidualProbability(Number(val))}
                      className="space-y-2"
                    >
                      {PROBABILITY_LEVELS.map((level) => (
                        <div key={level.value} className="flex items-center space-x-3 p-2 rounded border">
                          <RadioGroupItem value={String(level.value)} id={`res-prob-${level.value}`} />
                          <Label htmlFor={`res-prob-${level.value}`} className="flex-1 cursor-pointer text-sm">
                            {level.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="mb-2 block">Impatto Residuo</Label>
                    <RadioGroup
                      value={String(residualImpact || '')}
                      onValueChange={(val) => setResidualImpact(Number(val))}
                      className="space-y-2"
                    >
                      {IMPACT_LEVELS.map((level) => (
                        <div key={level.value} className="flex items-center space-x-3 p-2 rounded border">
                          <RadioGroupItem value={String(level.value)} id={`res-imp-${level.value}`} />
                          <Label htmlFor={`res-imp-${level.value}`} className="flex-1 cursor-pointer text-sm">
                            {level.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {canProceedToSummary && (
                    <Card className="bg-accent">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold mb-1">Rischio Residuo:</p>
                            <p className="text-sm text-muted-foreground">
                              Riduzione: {inherentScore} → {residualScore} ({Math.round((1 - residualScore/inherentScore) * 100)}%)
                            </p>
                          </div>
                          <Badge variant={getRiskLevel(residualScore).color as any} className="text-lg px-4 py-2">
                            <TrendingDown className="h-4 w-4 mr-2" />
                            {getRiskLevel(residualScore).level}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 'summary' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                <h3 className="text-2xl font-bold">Valutazione Completata!</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-2">
                      <p className="text-sm text-muted-foreground">Rischio Inerente</p>
                      <Badge variant={getRiskLevel(inherentScore).color as any} className="text-2xl px-6 py-3">
                        {getRiskLevel(inherentScore).level}
                      </Badge>
                      <p className="text-sm">Score: {inherentScore}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-2">
                      <p className="text-sm text-muted-foreground">Rischio Residuo</p>
                      <Badge variant={getRiskLevel(residualScore).color as any} className="text-2xl px-6 py-3">
                        {getRiskLevel(residualScore).level}
                      </Badge>
                      <p className="text-sm">Score: {residualScore}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-3">Controlli Selezionati ({selectedControls.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedControls.map(controlId => (
                      <Badge key={controlId} variant="outline">{controlId}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {treatmentPlan && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Piano di Azione</h4>
                      {savedRiskId && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowCreateTask(true)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Crea Task
                        </Button>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{treatmentPlan}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => {
                if (currentStep === 'treatment') setCurrentStep('assessment');
                else if (currentStep === 'summary') setCurrentStep('treatment');
              }}
              disabled={currentStep === 'assessment' || isSubmitting}
            >
              Indietro
            </Button>

            <div className="flex gap-2">
              {currentStep === 'assessment' && (
                <>
                  {/* Quick save button - save just the assessment */}
                  <Button
                    variant="outline"
                    onClick={() => handleSubmit(true)}
                    disabled={!canSaveAssessment || isSubmitting}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Salvataggio..." : "Salva Valutazione"}
                  </Button>
                  <Button
                    onClick={() => setCurrentStep('treatment')}
                    disabled={!canProceedToTreatment}
                  >
                    Tratta Rischio
                  </Button>
                </>
              )}
              {currentStep === 'treatment' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleSubmit(true)}
                    disabled={isSubmitting}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salva e Chiudi
                  </Button>
                  <Button
                    onClick={() => setCurrentStep('summary')}
                    disabled={!canProceedToSummary}
                  >
                    Vai al Riepilogo
                  </Button>
                </>
              )}
              {currentStep === 'summary' && (
                <Button onClick={() => handleSubmit(false)} disabled={isSubmitting}>
                  {isSubmitting ? "Salvataggio..." : savedRiskId ? "Chiudi" : "Salva Valutazione"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Create Task Dialog */}
        <CreateTaskFromRiskDialog
          open={showCreateTask}
          onOpenChange={setShowCreateTask}
          riskData={{
            id: savedRiskId || initialRiskData?.id || "",
            name: threat?.name || "",
            treatmentPlan,
            treatmentDeadline,
            treatmentResponsible: responsible,
            treatmentCost: treatmentCost ? parseFloat(treatmentCost) : undefined,
          }}
        />
      </DialogContent>
    </Dialog>
  );
}