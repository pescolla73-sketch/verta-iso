import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Bot, AlertCircle } from "lucide-react";
import { ControlGuidance } from "@/data/controlGuidance";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ControlWizardCardProps {
  control: {
    id: string;
    control_id: string;
    title: string;
    domain: string;
    status?: string;
    responsible?: string;
    implementation_notes?: string;
    justification?: string;
  };
  guidance: ControlGuidance | null;
  currentIndex: number;
  totalInSection: number;
  onSave: (data: {
    status: string;
    responsible?: string;
    implementation_notes?: string;
    justification?: string;
  }) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSkip: () => void;
  onAskAI: () => void;
}

export function ControlWizardCard({
  control,
  guidance,
  currentIndex,
  totalInSection,
  onSave,
  onPrevious,
  onNext,
  onSkip,
  onAskAI,
}: ControlWizardCardProps) {
  const [status, setStatus] = useState(control.status || "not_implemented");
  const [responsible, setResponsible] = useState(control.responsible || "");
  const [notes, setNotes] = useState(control.implementation_notes || "");
  const [justification, setJustification] = useState(control.justification || "");
  const [showExamples, setShowExamples] = useState(false);
  const [showImplementation, setShowImplementation] = useState(false);

  const handleSaveAndNext = () => {
    onSave({
      status,
      responsible,
      implementation_notes: notes,
      justification: status === "not_applicable" ? justification : undefined,
    });
    onNext();
  };

  const needsJustification = status === "not_applicable" && (!justification || justification.length < 20);

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline">{control.domain}</Badge>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} di {totalInSection}
          </span>
        </div>
        <CardTitle className="text-2xl">
          {control.control_id} - {control.title}
        </CardTitle>
        <div className="w-full bg-muted rounded-full h-2 mt-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / totalInSection) * 100}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Description */}
        {guidance && (
          <>
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                📖 COSA SIGNIFICA?
              </h3>
              <p className="text-muted-foreground">{guidance.description}</p>
              <p className="text-sm text-muted-foreground italic">{guidance.why}</p>
            </div>

            {/* Examples */}
            <Collapsible open={showExamples} onOpenChange={setShowExamples}>
              <CollapsibleTrigger className="flex items-center gap-2 font-semibold hover:text-primary transition-colors w-full">
                💡 ESEMPI PRATICI
                {showExamples ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <ul className="space-y-1 text-muted-foreground">
                  {guidance.examples.map((example, idx) => (
                    <li key={idx} className="ml-4">• {example}</li>
                  ))}
                </ul>
              </CollapsibleContent>
            </Collapsible>

            {/* Implementation Guide */}
            <Collapsible open={showImplementation} onOpenChange={setShowImplementation}>
              <CollapsibleTrigger className="flex items-center gap-2 font-semibold hover:text-primary transition-colors w-full">
                ✅ COME IMPLEMENTARE
                {showImplementation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <ol className="space-y-1 text-muted-foreground">
                  {guidance.howToImplement.map((step, idx) => (
                    <li key={idx} className="ml-4">{step}</li>
                  ))}
                </ol>
              </CollapsibleContent>
            </Collapsible>
          </>
        )}

        {/* Status Selection */}
        <div className="space-y-4 border-t pt-6">
          <h3 className="font-semibold">🎯 QUESTO CONTROLLO È APPLICABILE?</h3>
          <RadioGroup value={status} onValueChange={setStatus}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="not_implemented" id="not_implemented" />
              <Label htmlFor="not_implemented" className="cursor-pointer">
                Sì, lo implementeremo (Non ancora implementato)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="partial" id="partial" />
              <Label htmlFor="partial" className="cursor-pointer">
                Sì, parzialmente implementato
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="implemented" id="implemented" />
              <Label htmlFor="implemented" className="cursor-pointer">
                Sì, già completamente implementato
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="not_applicable" id="not_applicable" />
              <Label htmlFor="not_applicable" className="cursor-pointer">
                No, non applicabile
              </Label>
            </div>
          </RadioGroup>

          {status === "not_applicable" && (
            <div className="space-y-2 pl-6">
              <Label htmlFor="justification">
                Giustificazione (obbligatoria, min 20 caratteri) *
              </Label>
              <Textarea
                id="justification"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Spiega perché questo controllo non è applicabile alla tua organizzazione..."
                rows={3}
                className={needsJustification ? "border-destructive" : ""}
              />
              {needsJustification && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    La giustificazione è obbligatoria e deve essere di almeno 20 caratteri
                  </AlertDescription>
                </Alert>
              )}
              {guidance?.notApplicableExamples && guidance.notApplicableExamples.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Esempi di N/A: {guidance.notApplicableExamples.join(", ")}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Responsible & Notes */}
        {status !== "not_applicable" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="responsible">Responsabile</Label>
              <Select value={responsible} onValueChange={setResponsible}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona responsabile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ciso">CISO</SelectItem>
                  <SelectItem value="cto">CTO</SelectItem>
                  <SelectItem value="it_manager">IT Manager</SelectItem>
                  <SelectItem value="system_admin">System Administrator</SelectItem>
                  <SelectItem value="hr_manager">HR Manager</SelectItem>
                  <SelectItem value="dpo">DPO</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Note implementazione</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Aggiungi dettagli sull'implementazione..."
                rows={3}
              />
            </div>
          </>
        )}

        {/* AI Assistant */}
        <Button variant="outline" className="w-full" onClick={onAskAI}>
          <Bot className="w-4 h-4 mr-2" />
          Hai dubbi? Chiedi all'assistente AI
        </Button>

        {/* Navigation */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onPrevious} disabled={currentIndex === 0}>
            ⬅️ Precedente
          </Button>
          <Button variant="ghost" onClick={onSkip}>
            ⏭️ Salta
          </Button>
          <div className="flex-1" />
          <Button onClick={handleSaveAndNext} disabled={needsJustification}>
            Salva e Avanti ➡️
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
