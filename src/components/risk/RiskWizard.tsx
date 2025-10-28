import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { assetTypeQuestions, calculateRiskFromAnswers } from "@/data/riskQuestions";
import { scenarioCategories, getScenarioById, calculateScenarioRisk, type Scenario } from "@/data/scenarioLibrary";
import { WizardStepper } from "../wizard/WizardStepper";

interface RiskWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId?: string;
  scenarioId?: string;
  mode?: 'asset' | 'scenario';
}

export function RiskWizard({ open, onOpenChange, assetId, scenarioId, mode = 'asset' }: RiskWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  // Fetch asset data (for asset mode)
  const { data: asset } = useQuery({
    queryKey: ["asset", assetId],
    queryFn: async () => {
      if (!assetId) return null;
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("id", assetId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!assetId && mode === 'asset'
  });

  // Fetch all assets (for scenario mode)
  const { data: allAssets = [] } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data || [];
    },
    enabled: mode === 'scenario'
  });

  useEffect(() => {
    if (scenarioId && mode === 'scenario') {
      const scenario = getScenarioById(scenarioId);
      setSelectedScenario(scenario || null);
    }
  }, [scenarioId, mode]);

  const questions = mode === 'asset' && asset?.asset_type 
    ? assetTypeQuestions[asset.asset_type as keyof typeof assetTypeQuestions] || []
    : selectedScenario?.questions || [];
  
  const totalSteps = mode === 'scenario' 
    ? questions.length + 2
    : questions.length + 1;

  const handleSubmit = async () => {
    if (mode === 'asset' && !asset) {
      toast.error("Nessun asset selezionato");
      return;
    }

    if (mode === 'scenario' && !selectedScenario) {
      toast.error("Nessuno scenario selezionato");
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (mode === 'asset') {
        const riskData = calculateRiskFromAnswers(answers);
        
        const { error } = await supabase.from("risks").insert({
          risk_type: 'asset-specific',
          asset_id: assetId,
          scope: 'Asset singolo',
          risk_id: `RISK-${Date.now()}`,
          name: `Rischio ${asset?.name}`,
          description: `Valutazione rischio per asset: ${asset?.name}`,
          inherent_probability: String(riskData.inherent.probability),
          inherent_impact: String(riskData.inherent.impact),
          inherent_risk_score: riskData.inherent.score,
          inherent_risk_level: riskData.inherent.level,
          treatment_strategy: riskData.treatment,
          related_controls: riskData.controls,
          residual_probability: String(riskData.residual.probability),
          residual_impact: String(riskData.residual.impact),
          residual_risk_score: riskData.residual.score,
          residual_risk_level: riskData.residual.level,
          status: "Identificato"
        });
        
        if (error) throw error;
      } else {
        const scenarioRisk = calculateScenarioRisk(selectedScenario!, answers);
        
        const { error } = await supabase.from("risks").insert({
          risk_type: 'scenario',
          asset_id: null,
          affected_asset_ids: selectedAssetIds.length > 0 ? selectedAssetIds : null,
          scope: selectedScenario!.scope,
          risk_id: `RISK-${Date.now()}`,
          name: selectedScenario!.name,
          description: selectedScenario!.description,
          inherent_probability: String(scenarioRisk.inherent.probability),
          inherent_impact: String(scenarioRisk.inherent.impact),
          inherent_risk_score: scenarioRisk.inherent.score,
          inherent_risk_level: scenarioRisk.inherent.level,
          treatment_strategy: "Mitigazione",
          related_controls: scenarioRisk.controls,
          residual_probability: String(scenarioRisk.residual.probability),
          residual_impact: String(scenarioRisk.residual.impact),
          residual_risk_score: scenarioRisk.residual.score,
          residual_risk_level: scenarioRisk.residual.level,
          status: "Identificato"
        });
        
        if (error) throw error;
      }
      
      await queryClient.invalidateQueries({ queryKey: ["risks"] });
      
      toast.success("Rischio valutato con successo!");
      onOpenChange(false);
      setCurrentStep(0);
      setAnswers({});
      setSelectedAssetIds([]);
    } catch (error) {
      console.error("Error saving risk:", error);
      toast.error("Errore nel salvare la valutazione");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAssetSelectionStep = mode === 'scenario' && currentStep === 0;
  const adjustedStep = mode === 'scenario' ? currentStep - 1 : currentStep;
  const currentQuestion = questions[adjustedStep];
  const isLastQuestion = mode === 'scenario' 
    ? currentStep === questions.length 
    : currentStep === questions.length - 1;
  const isSummaryStep = mode === 'scenario'
    ? currentStep === questions.length + 1
    : currentStep === questions.length;

  const renderSummary = () => {
    const risk = mode === 'asset'
      ? calculateRiskFromAnswers(answers)
      : calculateScenarioRisk(selectedScenario!, answers);
    
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
          <h3 className="text-2xl font-bold">Valutazione Completata!</h3>
          {mode === 'scenario' && (
            <p className="text-lg text-muted-foreground">Scenario: {selectedScenario?.name}</p>
          )}
        </div>

        {mode === 'scenario' && selectedAssetIds.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-3">Asset Impattati:</h4>
              <div className="flex flex-wrap gap-2">
                {allAssets
                  .filter(a => selectedAssetIds.includes(a.id))
                  .map(asset => (
                    <Badge key={asset.id} variant="secondary">
                      {asset.name}
                    </Badge>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Rischio Inerente</h4>
              <div className="flex items-center gap-4">
                <Badge 
                  variant={
                    risk.inherent.level === "Critico" ? "destructive" :
                    risk.inherent.level === "Alto" ? "default" :
                    risk.inherent.level === "Medio" ? "secondary" :
                    "outline"
                  }
                  className="text-lg px-4 py-2"
                >
                  {risk.inherent.level}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  <p>Score: {risk.inherent.score}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Controlli Raccomandati</h4>
              <div className="flex flex-wrap gap-2">
                {risk.controls.map((control) => (
                  <Badge key={control} variant="outline">
                    {control}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Rischio Residuo</h4>
              <div className="flex items-center gap-4">
                <Badge 
                  variant={
                    risk.residual.level === "Critico" ? "destructive" :
                    risk.residual.level === "Alto" ? "default" :
                    risk.residual.level === "Medio" ? "secondary" :
                    "outline"
                  }
                  className="text-lg px-4 py-2"
                >
                  {risk.residual.level}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  <p>Score: {risk.residual.score}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {isSummaryStep 
              ? "Riepilogo Valutazione" 
              : mode === 'asset' 
                ? `Valutazione Rischio: ${asset?.name}` 
                : `Scenario: ${selectedScenario?.name || 'Seleziona scenario'}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!isSummaryStep && (
            <WizardStepper 
              currentStep={currentStep} 
              totalSteps={totalSteps}
              stepLabels={
                mode === 'scenario'
                  ? ["Asset Impattati", ...questions.map((_, i) => `Domanda ${i + 1}`), "Riepilogo"]
                  : [...questions.map((_, i) => `Domanda ${i + 1}`), "Riepilogo"]
              }
            />
          )}

          {isSummaryStep ? (
            renderSummary()
          ) : isAssetSelectionStep ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Quali asset sono impattati?</h3>
                <p className="text-sm text-muted-foreground">
                  Seleziona uno o più asset coinvolti in questo scenario
                </p>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {allAssets.map((asset) => (
                  <div 
                    key={asset.id}
                    className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedAssetIds.includes(asset.id) ? 'bg-accent border-primary' : 'hover:bg-accent'
                    }`}
                    onClick={() => {
                      setSelectedAssetIds(prev => 
                        prev.includes(asset.id)
                          ? prev.filter(id => id !== asset.id)
                          : [...prev, asset.id]
                      );
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedAssetIds.includes(asset.id)}
                      onChange={() => {}}
                      className="h-4 w-4"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{asset.name}</p>
                      <p className="text-sm text-muted-foreground">{asset.asset_type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  {currentQuestion?.text}
                </h3>
              </div>

              <RadioGroup
                value={answers[currentQuestion?.id]}
                onValueChange={(value) => setAnswers({ ...answers, [currentQuestion.id]: value })}
                className="space-y-3"
              >
                {currentQuestion?.options.map((option) => (
                  <div key={option.value} className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-accent">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label 
                      htmlFor={option.value}
                      className="flex-1 cursor-pointer text-base leading-relaxed"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0 || isSubmitting}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>

            {isSummaryStep ? (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Salvataggio..." : "Salva Valutazione"}
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={isAssetSelectionStep ? selectedAssetIds.length === 0 : !answers[currentQuestion?.id]}
              >
                {isLastQuestion ? "Vai al Riepilogo" : "Avanti"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
