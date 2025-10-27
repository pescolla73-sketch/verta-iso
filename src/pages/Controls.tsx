import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Wand2, Table2 } from "lucide-react";

export default function Controls() {
  const navigate = useNavigate();

  const { data: controls } = useQuery({
    queryKey: ["controls"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("controls")
        .select("*")
        .order("control_id");
      if (error) throw error;
      return data || [];
    },
  });

  const calculateProgress = () => {
    if (!controls) return 0;
    const completed = controls.filter(
      (c) => c.status && c.status !== "not_implemented"
    ).length;
    return Math.round((completed / controls.length) * 100);
  };

  const progress = calculateProgress();
  const hasProgress = progress > 0 && progress < 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground">Gestione Controlli ISO 27001</h1>
        <p className="text-muted-foreground mt-2">
          Seleziona la modalità di compilazione che preferisci
        </p>
      </div>

      {/* Progress indicator */}
      {controls && (
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avanzamento complessivo</span>
                <span className="font-semibold">{progress}%</span>
              </div>
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground">
                {controls.filter((c) => c.status && c.status !== "not_implemented").length}/{controls.length} controlli completati
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Choice cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Wizard Card */}
        <Card className="shadow-card hover:shadow-lg transition-smooth border-2 hover:border-primary/50">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto">
              <Wand2 className="w-8 h-8 text-primary" />
            </div>
            
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold">🧙 Wizard Guidato</h2>
              <div className="inline-block px-3 py-1 bg-success/20 text-success-foreground rounded-full text-sm font-medium">
                ⭐ Consigliato
              </div>
            </div>

            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✅ Compilazione guidata passo-passo</li>
              <li>✅ Spiegazioni in linguaggio semplice</li>
              <li>✅ Esempi pratici per ogni controllo</li>
              <li>✅ Assistente AI per domande</li>
              <li>✅ Ideale per prima compilazione</li>
            </ul>

            <Button 
              onClick={() => navigate("/controls/wizard")}
              size="lg" 
              className="w-full"
            >
              {hasProgress ? "▶️ Riprendi Wizard" : "🚀 Inizia Wizard"}
            </Button>

            {hasProgress && (
              <p className="text-xs text-center text-muted-foreground">
                Hai già compilato {progress}% dei controlli
              </p>
            )}
          </CardContent>
        </Card>

        {/* Table Card */}
        <Card className="shadow-card hover:shadow-lg transition-smooth border-2 hover:border-primary/50">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto">
              <Table2 className="w-8 h-8 text-primary" />
            </div>
            
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold">📊 Vista Tabella</h2>
              <div className="inline-block px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm font-medium">
                Per esperti
              </div>
            </div>

            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>📋 Visualizzazione completa di tutti i controlli</li>
              <li>📋 Modifica rapida e diretta</li>
              <li>📋 Ricerca e filtri avanzati</li>
              <li>📋 Ideale per revisione o aggiornamenti</li>
              <li>📋 Vista d'insieme immediata</li>
            </ul>

            <Button 
              onClick={() => navigate("/controls/table")}
              size="lg" 
              variant="outline"
              className="w-full"
            >
              📊 Apri Tabella
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Help card */}
      <Card className="shadow-card bg-muted/50">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h3 className="font-semibold">💡 Quale scegliere?</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-primary">Usa il Wizard se:</p>
                <ul className="mt-1 space-y-1 text-muted-foreground">
                  <li>• È la tua prima compilazione</li>
                  <li>• Vuoi una guida passo-passo</li>
                  <li>• Non sei esperto di ISO 27001</li>
                  <li>• Preferisci esempi pratici</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-primary">Usa la Tabella se:</p>
                <ul className="mt-1 space-y-1 text-muted-foreground">
                  <li>• Devi fare modifiche rapide</li>
                  <li>• Conosci già i controlli</li>
                  <li>• Vuoi una vista d'insieme</li>
                  <li>• Stai facendo manutenzione/revisione</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
