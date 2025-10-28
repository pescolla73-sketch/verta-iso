import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { InfoIcon, CheckCircle, AlertTriangle, ArrowLeft, ArrowRight, Save } from "lucide-react";
import {
  getQuestionsForAsset,
  calculateRiskFromAnswers,
  type RiskAnswers,
  type QuestionStep
} from "@/data/riskQuestions";
import { cn } from "@/lib/utils";

interface RiskWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId?: string;
}

export function RiskWizard({ open, onOpenChange, assetId }: RiskWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<RiskAnswers>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // Fetch selected asset
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
    enabled: !!assetId
  });

  const questions: QuestionStep[] = asset 
    ? getQuestionsForAsset(asset.asset_type)
    : [];

  const totalSteps = questions.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleAnswer = (questionId: string, value: string | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleMultipleAnswer = (questionId: string, value: string, checked: boolean) => {
    setAnswers(prev => {
      const current = (prev[questionId] as string[]) || [];
      if (checked) {
        return { ...prev, [questionId]: [...current, value] };
      } else {
        return { ...prev, [questionId]: current.filter(v => v !== value) };
      }
    });
  };

  const canProceed = () => {
    const currentQuestions = questions[currentStep]?.questions || [];
    return currentQuestions.every(q => {
      const answer = answers[q.id];
      if (q.type === 'multiple') {
        return Array.isArray(answer) && answer.length > 0;
      }
      return !!answer;
    });
  };

  const handleNext = () => {
    if (!canProceed()) {
      toast.error("Rispondi a tutte le domande prima di continuare");
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!asset || !canProceed()) {
      toast.error("Completa tutte le domande");
      return;
    }

    setIsSubmitting(true);
    try {
      // Calculate risk from answers
      const calculation = calculateRiskFromAnswers(answers, asset.asset_type);

      // Generate risk name and description
      const riskName = `Rischio ${asset.name}`;
      const description = calculation.insights.join('. ');

      // Insert risk into database
      const { error } = await supabase.from("risks").insert({
        risk_id: `RISK-${Date.now()}`,
        name: riskName,
        description,
        asset_id: asset.id,
        inherent_probability: getLevelName(calculation.inherent.probability),
        inherent_impact: getLevelName(calculation.inherent.impact),
        inherent_risk_score: calculation.inherent.score,
        inherent_risk_level: calculation.inherent.level,
        treatment_strategy: calculation.neededControls.length > 0 ? 'mitigate' : 'accept',
        treatment_description: calculation.neededControls.length > 0
          ? `Implementare controlli: ${calculation.neededControls.join(', ')}`
          : 'Rischio accettabile allo stato attuale',
        related_controls: calculation.neededControls,
        residual_probability: getLevelName(calculation.residual.probability),
        residual_impact: getLevelName(calculation.residual.impact),
        residual_risk_score: calculation.residual.score,
        residual_risk_level: calculation.residual.level,
        status: 'Identificato'
      });

      if (error) throw error;

      toast.success("✅ Valutazione completata!");
      queryClient.invalidateQueries({ queryKey: ["risks"] });
      onOpenChange(false);
      setCurrentStep(0);
      setAnswers({});
    } catch (error: any) {
      console.error("Error saving risk:", error);
      toast.error(`Errore: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Critico': return 'bg-red-100 border-red-500 dark:bg-red-950';
      case 'Alto': return 'bg-orange-100 border-orange-500 dark:bg-orange-950';
      case 'Medio': return 'bg-yellow-100 border-yellow-500 dark:bg-yellow-950';
      case 'Basso': return 'bg-green-100 border-green-500 dark:bg-green-950';
      default: return 'bg-gray-100 border-gray-500 dark:bg-gray-950';
    }
  };

  const getLevelName = (score: number): string => {
    if (score === 5) return 'Molto Alta';
    if (score === 4) return 'Alta';
    if (score === 3) return 'Media';
    if (score === 2) return 'Bassa';
    return 'Molto Bassa';
  };

  // Calculate preview if on last step
  const showPreview = currentStep === totalSteps - 1 && asset;
  const calculation = showPreview 
    ? calculateRiskFromAnswers(answers, asset.asset_type)
    : null;

  if (!asset) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seleziona un Asset</DialogTitle>
          </DialogHeader>
          <p>Seleziona un asset dalla tabella per iniziare la valutazione.</p>
        </DialogContent>
      </Dialog>
    );
  }

  const currentStepData = questions[currentStep];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            Valutazione Rischi: {asset.name}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {currentStep + 1} di {totalSteps}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>

        {/* Current Step */}
        {currentStepData && (
          <div className="space-y-6 py-4">
            <div>
              <h3 className="text-lg font-semibold">{currentStepData.title}</h3>
              <p className="text-sm text-muted-foreground">{currentStepData.description}</p>
            </div>

            {currentStepData.questions.map((question) => (
              <div key={question.id} className="space-y-3">
                <Label className="text-base font-medium">{question.text}</Label>
                {question.helpText && (
                  <p className="text-sm text-muted-foreground flex items-start gap-2">
                    <InfoIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    {question.helpText}
                  </p>
                )}

                {question.type === 'single' ? (
                  <RadioGroup
                    value={answers[question.id] as string}
                    onValueChange={(value) => handleAnswer(question.id, value)}
                  >
                    {question.options.map((option) => (
                      <div key={option.value} className="flex items-start space-x-3 space-y-0">
                        <RadioGroupItem value={option.value} id={`${question.id}-${option.value}`} />
                        <Label
                          htmlFor={`${question.id}-${option.value}`}
                          className="font-normal cursor-pointer flex-1"
                        >
                          <div>
                            <div>{option.label}</div>
                            {option.description && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {option.description}
                              </div>
                            )}
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <div className="space-y-2">
                    {question.options.map((option) => (
                      <div key={option.value} className="flex items-start space-x-3">
                        <Checkbox
                          id={`${question.id}-${option.value}`}
                          checked={(answers[question.id] as string[] || []).includes(option.value)}
                          onCheckedChange={(checked) =>
                            handleMultipleAnswer(question.id, option.value, checked as boolean)
                          }
                        />
                        <Label
                          htmlFor={`${question.id}-${option.value}`}
                          className="font-normal cursor-pointer"
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Results Preview */}
        {showPreview && calculation && (
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold">📊 Risultato Valutazione</h3>

            <div className="grid grid-cols-2 gap-4">
              <Card className={cn("border-2", getRiskColor(calculation.inherent.level))}>
                <CardHeader>
                  <CardTitle className="text-sm">Rischio Attuale</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-center mb-2">
                    {calculation.inherent.score}
                  </div>
                  <Badge className="w-full justify-center" variant="destructive">
                    {calculation.inherent.level}
                  </Badge>
                </CardContent>
              </Card>

              <Card className={cn("border-2", getRiskColor(calculation.residual.level))}>
                <CardHeader>
                  <CardTitle className="text-sm">Dopo Controlli</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-center mb-2">
                    {calculation.residual.score}
                  </div>
                  <Badge className="w-full justify-center" variant="outline">
                    {calculation.residual.level}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {calculation.insights.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {calculation.insights.map((insight, i) => (
                      <li key={i}>{insight}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {calculation.neededControls.length > 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Controlli da implementare:</strong>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {calculation.neededControls.map(control => (
                      <Badge key={control} variant="outline">
                        {control}
                      </Badge>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Indietro
          </Button>

          {currentStep < totalSteps - 1 ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Avanti
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canProceed() || isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? "Salvataggio..." : "Salva Valutazione"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
