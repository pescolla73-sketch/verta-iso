import { useState, useEffect } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarIcon, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  calculateRiskScore,
  getRiskCategory,
  getRiskColor,
  getRiskBadgeVariant,
  THREAT_CATEGORIES,
  TREATMENT_STRATEGIES,
  PROBABILITY_LEVELS,
  IMPACT_LEVELS,
  RiskLevel,
} from "@/utils/riskCalculation";

const riskSchema = z.object({
  // Step 1
  risk_id: z.string().min(1, "Risk ID obbligatorio"),
  name: z.string().min(1, "Nome obbligatorio"),
  description: z.string().optional(),
  asset_id: z.string().min(1, "Asset obbligatorio"),
  threat_category: z.string().min(1, "Minaccia obbligatoria"),
  
  // Step 2
  inherent_probability: z.string().min(1, "Probabilità obbligatoria"),
  inherent_impact: z.string().min(1, "Impatto obbligatorio"),
  
  // Step 3
  treatment_strategy: z.string().min(1, "Strategia obbligatoria"),
  treatment_description: z.string().optional(),
  treatment_cost: z.string().optional(),
  treatment_deadline: z.date().optional(),
  treatment_responsible: z.string().optional(),
  related_controls: z.array(z.string()).optional(),
  
  // Step 4 (conditional)
  residual_probability: z.string().optional(),
  residual_impact: z.string().optional(),
});

type RiskFormValues = z.infer<typeof riskSchema>;

interface RiskWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RiskWizard({ open, onOpenChange }: RiskWizardProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<RiskFormValues>({
    resolver: zodResolver(riskSchema),
    defaultValues: {
      risk_id: "",
      name: "",
      description: "",
      asset_id: "",
      threat_category: "",
      inherent_probability: "",
      inherent_impact: "",
      treatment_strategy: "",
      treatment_description: "",
      treatment_cost: "",
      treatment_responsible: "",
      related_controls: [],
      residual_probability: "",
      residual_impact: "",
    },
  });

  // Fetch assets
  const { data: assets } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch controls
  const { data: controls } = useQuery({
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

  const watchedValues = form.watch();
  
  // Calculate inherent risk
  const inherentScore = watchedValues.inherent_probability && watchedValues.inherent_impact
    ? calculateRiskScore(
        watchedValues.inherent_probability as RiskLevel,
        watchedValues.inherent_impact as RiskLevel
      )
    : 0;
  
  const inherentCategory = inherentScore > 0 ? getRiskCategory(inherentScore) : null;
  
  // Calculate residual risk
  const residualScore = watchedValues.residual_probability && watchedValues.residual_impact
    ? calculateRiskScore(
        watchedValues.residual_probability as RiskLevel,
        watchedValues.residual_impact as RiskLevel
      )
    : 0;
  
  const residualCategory = residualScore > 0 ? getRiskCategory(residualScore) : null;

  const maxSteps = watchedValues.treatment_strategy === "mitigate" ? 4 : 3;

  const onSubmit = async (values: RiskFormValues) => {
    setIsSubmitting(true);
    try {
      // Get organization ID
      let organizationId = null;
      try {
        const { data: orgs } = await supabase
          .from("organization")
          .select("id")
          .limit(1)
          .single();
        if (orgs) organizationId = orgs.id;
      } catch (err) {
        console.log("No organization found");
      }

      const riskData = {
        organization_id: organizationId,
        risk_id: values.risk_id,
        name: values.name,
        description: values.description || null,
        asset_id: values.asset_id,
        inherent_probability: values.inherent_probability,
        inherent_impact: values.inherent_impact,
        inherent_risk_score: inherentScore,
        inherent_risk_level: inherentCategory,
        treatment_strategy: values.treatment_strategy,
        treatment_description: values.treatment_description || null,
        treatment_cost: values.treatment_cost ? parseFloat(values.treatment_cost) : null,
        treatment_deadline: values.treatment_deadline
          ? format(values.treatment_deadline, "yyyy-MM-dd")
          : null,
        treatment_responsible: values.treatment_responsible || null,
        related_controls: values.related_controls || [],
        residual_probability: values.residual_probability || null,
        residual_impact: values.residual_impact || null,
        residual_risk_score: residualScore || null,
        residual_risk_level: residualCategory || null,
        status: "Identificato",
      };

      const { error } = await supabase.from("risks").insert([riskData]);

      if (error) {
        console.error("Risk creation error:", error);
        throw error;
      }

      toast.success("Rischio creato con successo");
      queryClient.invalidateQueries({ queryKey: ["risks"] });
      onOpenChange(false);
      form.reset();
      setStep(1);
    } catch (error: any) {
      toast.error(error.message || "Errore nella creazione del rischio");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    const fields = getFieldsForStep(step);
    const isValid = await form.trigger(fields as any);
    if (isValid) {
      setStep(step + 1);
    }
  };

  const getFieldsForStep = (currentStep: number): string[] => {
    switch (currentStep) {
      case 1:
        return ["risk_id", "name", "asset_id", "threat_category"];
      case 2:
        return ["inherent_probability", "inherent_impact"];
      case 3:
        return ["treatment_strategy"];
      case 4:
        return ["residual_probability", "residual_impact"];
      default:
        return [];
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            🎯 Valutazione Nuovo Rischio
          </DialogTitle>
        </DialogHeader>

        {/* Progress Stepper */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            {["Identificazione", "Valutazione", "Trattamento", "Residuo"].slice(0, maxSteps).map((label, index) => {
              const stepNum = index + 1;
              const isActive = step === stepNum;
              const isCompleted = step > stepNum;
              
              return (
                <div key={stepNum} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-2",
                        isCompleted && "bg-green-500 text-white",
                        isActive && "bg-primary text-primary-foreground",
                        !isActive && !isCompleted && "bg-muted text-muted-foreground"
                      )}
                    >
                      {isCompleted ? "✓" : stepNum}
                    </div>
                    <p className="text-xs text-center">{label}</p>
                  </div>
                  {stepNum < maxSteps && (
                    <div
                      className={cn(
                        "h-1 flex-1 mx-2",
                        isCompleted ? "bg-green-500" : "bg-muted"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <Progress value={(step / maxSteps) * 100} className="h-2" />
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Identification */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Step 1: Identificazione del Rischio</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="risk_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Risk ID *</FormLabel>
                        <FormControl>
                          <Input placeholder="es. RISK-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="asset_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Asset a Rischio *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona asset" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {assets?.map((asset) => (
                              <SelectItem key={asset.id} value={asset.id}>
                                {asset.name} ({asset.asset_type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Rischio *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="es. Perdita dati per ransomware su server produzione"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="threat_category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minaccia *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona minaccia" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {THREAT_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrizione</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descrivi lo scenario di rischio..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 2: Inherent Risk Assessment */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">
                  Step 2: Valutazione Rischio Inerente (PRIMA del trattamento)
                </h3>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Valuta il rischio SENZA considerare i controlli attuali. Immagina lo scenario
                    peggiore.
                  </AlertDescription>
                </Alert>

                <FormField
                  control={form.control}
                  name="inherent_probability"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Probabilità che si verifichi *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-2"
                        >
                          {PROBABILITY_LEVELS.map((level) => (
                            <div
                              key={level.value}
                              className="flex items-center space-x-3 space-y-0 border rounded-lg p-3 hover:bg-muted/50 cursor-pointer"
                            >
                              <RadioGroupItem value={level.value} />
                              <div className="flex-1">
                                <p className="font-medium">{level.label}</p>
                                <p className="text-sm text-muted-foreground">{level.description}</p>
                              </div>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="inherent_impact"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Impatto se si verifica *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-2"
                        >
                          {IMPACT_LEVELS.map((level) => (
                            <div
                              key={level.value}
                              className="flex items-center space-x-3 space-y-0 border rounded-lg p-3 hover:bg-muted/50 cursor-pointer"
                            >
                              <RadioGroupItem value={level.value} />
                              <div className="flex-1">
                                <p className="font-medium">{level.label}</p>
                                <p className="text-sm text-muted-foreground">{level.description}</p>
                              </div>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {inherentScore > 0 && inherentCategory && (
                  <Card className={cn("border-2", getRiskColor(inherentCategory))}>
                    <CardHeader>
                      <CardTitle>📊 Livello di Rischio Inerente</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center space-y-4">
                        <div className="text-6xl font-bold">{inherentScore}</div>
                        <Badge variant={getRiskBadgeVariant(inherentCategory)} className="text-lg px-4 py-2">
                          {inherentCategory}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          Probabilità × Impatto = {inherentScore}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Step 3: Treatment Strategy */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Step 3: Strategia di Trattamento</h3>

                <FormField
                  control={form.control}
                  name="treatment_strategy"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Strategia *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-2"
                        >
                          {TREATMENT_STRATEGIES.map((strategy) => (
                            <div
                              key={strategy.value}
                              className="flex items-center space-x-3 space-y-0 border rounded-lg p-4 hover:bg-muted/50 cursor-pointer"
                            >
                              <RadioGroupItem value={strategy.value} />
                              <div className="flex-1">
                                <p className="font-medium">{strategy.label}</p>
                                <p className="text-sm text-muted-foreground">
                                  {strategy.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchedValues.treatment_strategy === "accept" && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Attenzione</AlertTitle>
                    <AlertDescription>
                      L'accettazione del rischio deve essere approvata dal management. Documenta
                      la giustificazione dell'accettazione.
                    </AlertDescription>
                  </Alert>
                )}

                <FormField
                  control={form.control}
                  name="treatment_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Piano di Trattamento</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descrivi le azioni specifiche da implementare..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="treatment_cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Costo Stimato (€)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="treatment_deadline"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Scadenza Implementazione</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? format(field.value, "PPP") : <span>Seleziona data</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="treatment_responsible"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsabile</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome responsabile implementazione" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 4: Residual Risk (only for mitigate strategy) */}
            {step === 4 && watchedValues.treatment_strategy === "mitigate" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">
                  Step 4: Rischio Residuo (DOPO il trattamento)
                </h3>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Ora valuta il rischio DOPO aver implementato i controlli selezionati.
                  </AlertDescription>
                </Alert>

                <FormField
                  control={form.control}
                  name="residual_probability"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Probabilità Residua *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-2"
                        >
                          {PROBABILITY_LEVELS.map((level) => (
                            <div
                              key={level.value}
                              className="flex items-center space-x-3 space-y-0 border rounded-lg p-3 hover:bg-muted/50 cursor-pointer"
                            >
                              <RadioGroupItem value={level.value} />
                              <div className="flex-1">
                                <p className="font-medium">{level.label}</p>
                                <p className="text-sm text-muted-foreground">{level.description}</p>
                              </div>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="residual_impact"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Impatto Residuo *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-2"
                        >
                          {IMPACT_LEVELS.map((level) => (
                            <div
                              key={level.value}
                              className="flex items-center space-x-3 space-y-0 border rounded-lg p-3 hover:bg-muted/50 cursor-pointer"
                            >
                              <RadioGroupItem value={level.value} />
                              <div className="flex-1">
                                <p className="font-medium">{level.label}</p>
                                <p className="text-sm text-muted-foreground">{level.description}</p>
                              </div>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {residualScore > 0 && residualCategory && (
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="border-red-500 border-2">
                      <CardHeader>
                        <CardTitle className="text-center">Rischio Inerente</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center space-y-2">
                          <div className="text-4xl font-bold">{inherentScore}</div>
                          <Badge
                            variant={getRiskBadgeVariant(inherentCategory!)}
                            className="w-full justify-center"
                          >
                            {inherentCategory}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-green-500 border-2">
                      <CardHeader>
                        <CardTitle className="text-center">Rischio Residuo</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center space-y-2">
                          <div className="text-4xl font-bold">{residualScore}</div>
                          <Badge
                            variant={getRiskBadgeVariant(residualCategory)}
                            className="w-full justify-center"
                          >
                            {residualCategory}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {residualScore > 0 && (
                  <Alert variant={residualScore <= 6 ? "default" : "destructive"}>
                    {residualScore <= 6 ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    <AlertDescription>
                      {residualScore <= 6
                        ? "✅ Rischio residuo accettabile! Controlli efficaci."
                        : "⚠️ Rischio residuo ancora elevato. Considera controlli aggiuntivi."}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <DialogFooter className="gap-2">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                  ⬅️ Indietro
                </Button>
              )}
              {step < maxSteps && (
                <Button type="button" onClick={handleNext}>
                  Avanti ➡️
                </Button>
              )}
              {step === maxSteps && (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Salvataggio..." : "💾 Salva Rischio"}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}