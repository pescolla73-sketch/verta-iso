import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WizardStepper } from "@/components/wizard/WizardStepper";
import { ControlWizardCard } from "@/components/wizard/ControlWizardCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { controlGuidanceData } from "@/data/controlGuidance";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const wizardSteps = [
  { id: "intro", title: "Introduzione", description: "Panoramica" },
  { id: "organizational", title: "Organizzativi", description: "37 controlli" },
  { id: "people", title: "Persone", description: "8 controlli" },
  { id: "physical", title: "Fisici", description: "14 controlli" },
  { id: "technological", title: "Tecnologici", description: "34 controlli" },
  { id: "review", title: "Riepilogo", description: "Revisione finale" },
];

export default function Wizard() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentControlIndex, setCurrentControlIndex] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: controls, isLoading } = useQuery({
    queryKey: ["controls"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("controls")
        .select("*")
        .order("control_id");
      if (error) throw error;
      return data;
    },
  });

  const updateControlMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: {
        status: string;
        responsible?: string;
        implementation_notes?: string;
        justification?: string;
      };
    }) => {
      const { error } = await supabase
        .from("controls")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["controls"] });
      toast({
        title: "Salvato",
        description: "Controllo aggiornato con successo",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore durante il salvataggio",
        variant: "destructive",
      });
    },
  });

  const getCurrentDomainControls = () => {
    if (!controls) return [];
    const domainMap: Record<number, string> = {
      1: "Organizzativi",
      2: "Persone",
      3: "Fisici",
      4: "Tecnologici",
    };
    const domain = domainMap[currentStepIndex];
    return controls.filter((c) => c.domain === domain);
  };

  const currentDomainControls = getCurrentDomainControls();
  const currentControl = currentDomainControls[currentControlIndex];

  const handleSaveControl = async (updates: {
    status: string;
    responsible?: string;
    implementation_notes?: string;
    justification?: string;
  }) => {
    if (currentControl) {
      await updateControlMutation.mutateAsync({
        id: currentControl.id,
        updates,
      });
    }
  };

  const handleNext = () => {
    if (currentControlIndex < currentDomainControls.length - 1) {
      setCurrentControlIndex(currentControlIndex + 1);
    } else {
      // Move to next section
      if (currentStepIndex < wizardSteps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
        setCurrentControlIndex(0);
      }
    }
  };

  const handlePrevious = () => {
    if (currentControlIndex > 0) {
      setCurrentControlIndex(currentControlIndex - 1);
    } else {
      // Move to previous section
      if (currentStepIndex > 1) {
        setCurrentStepIndex(currentStepIndex - 1);
        setCurrentControlIndex(0);
      }
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleAskAI = () => {
    toast({
      title: "Assistente AI",
      description: "Funzionalità in arrivo - potrai fare domande specifiche su ogni controllo",
    });
  };

  const calculateProgress = () => {
    if (!controls) return 0;
    const completed = controls.filter(
      (c) => c.status && c.status !== "not_implemented"
    ).length;
    return Math.round((completed / controls.length) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Introduction Step
  if (currentStepIndex === 0) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <WizardStepper
          steps={wizardSteps}
          currentStep={currentStepIndex}
          onStepClick={setCurrentStepIndex}
        />
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-3xl">🎯 ISO 27001 Compliance Wizard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Benvenuto nel wizard di conformità!</h3>
              <p className="text-muted-foreground">
                Questo strumento ti guiderà passo dopo passo attraverso tutti i 93 controlli ISO 27001:2022,
                aiutandoti a capire cosa significano e come implementarli nella tua organizzazione.
              </p>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h4 className="font-semibold">📊 Panoramica controlli:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Controlli Organizzativi: 37</li>
                  <li>• Controlli Persone: 8</li>
                  <li>• Controlli Fisici: 14</li>
                  <li>• Controlli Tecnologici: 34</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">✨ Per ogni controllo troverai:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>✅ Spiegazione in linguaggio semplice</li>
                  <li>💡 Esempi pratici e concreti</li>
                  <li>📝 Guida passo-passo all'implementazione</li>
                  <li>🤖 Assistente AI per domande specifiche</li>
                </ul>
              </div>

              <div className="bg-primary/10 p-4 rounded-lg">
                <p className="text-sm">
                  <strong>💾 Salvataggio automatico:</strong> I tuoi progressi vengono salvati automaticamente.
                  Puoi interrompere in qualsiasi momento e riprendere da dove hai lasciato.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso attuale</span>
                  <span>{calculateProgress()}%</span>
                </div>
                <Progress value={calculateProgress()} />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={() => navigate("/")}>← Dashboard</Button>
              <div className="flex-1" />
              <Button onClick={() => setCurrentStepIndex(1)} size="lg">
                Inizia il wizard ➡️
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Review Step
  if (currentStepIndex === wizardSteps.length - 1) {
    const implementedCount = controls?.filter((c) => c.status === "implemented").length || 0;
    const partialCount = controls?.filter((c) => c.status === "partial").length || 0;
    const notApplicableCount = controls?.filter((c) => c.status === "not_applicable").length || 0;
    const notImplementedCount = controls?.filter((c) => c.status === "not_implemented").length || 0;

    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <WizardStepper
          steps={wizardSteps}
          currentStep={currentStepIndex}
          onStepClick={setCurrentStepIndex}
        />
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-3xl">📋 Riepilogo Conformità</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-600">{implementedCount}</div>
                <div className="text-sm text-muted-foreground">Implementati</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-yellow-600">{partialCount}</div>
                <div className="text-sm text-muted-foreground">Parziali</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-red-600">{notImplementedCount}</div>
                <div className="text-sm text-muted-foreground">Da implementare</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-gray-600">{notApplicableCount}</div>
                <div className="text-sm text-muted-foreground">Non applicabili</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold">Completamento complessivo</span>
                <span className="font-bold text-primary">{calculateProgress()}%</span>
              </div>
              <Progress value={calculateProgress()} />
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-semibold">🎯 Prossimi passi:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>1. Rivedi i controlli non implementati e crea un piano d'azione</li>
                <li>2. Verifica che tutti i controlli N/A abbiano una giustificazione valida</li>
                <li>3. Assicurati che ogni controllo abbia un responsabile assegnato</li>
                <li>4. Genera la dichiarazione di applicabilità (SoA) in PDF</li>
                <li>5. Pianifica audit interni per verificare l'implementazione</li>
              </ul>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setCurrentStepIndex(currentStepIndex - 1)}>
                ← Indietro
              </Button>
              <div className="flex-1" />
              <Button onClick={() => navigate("/soa")} size="lg">
                Genera SoA PDF 📥
              </Button>
              <Button onClick={() => navigate("/")} size="lg" variant="outline">
                Vai alla Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Control Steps
  if (!currentControl) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <Card>
          <CardContent className="py-8 text-center">
            <p>Nessun controllo disponibile per questa sezione</p>
            <Button className="mt-4" onClick={() => setCurrentStepIndex(currentStepIndex + 1)}>
              Vai alla prossima sezione
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const guidance = controlGuidanceData[currentControl.control_id] || null;

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <WizardStepper
        steps={wizardSteps}
        currentStep={currentStepIndex}
        onStepClick={setCurrentStepIndex}
      />

      <div className="mt-8">
        <ControlWizardCard
          control={currentControl}
          guidance={guidance}
          currentIndex={currentControlIndex}
          totalInSection={currentDomainControls.length}
          onSave={handleSaveControl}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onSkip={handleSkip}
          onAskAI={handleAskAI}
        />
      </div>
    </div>
  );
}
