import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, RefreshCw, Lock, Edit, AlertTriangle } from "lucide-react";

interface PolicyEditorProps {
  policyId: string;
  onSaved?: () => void;
}

export function PolicyEditor({ policyId, onSaved }: PolicyEditorProps) {
  const queryClient = useQueryClient();

  // ============ SEPARATE STATE FOR EACH FIELD ============
  // Info generali
  const [policyName, setPolicyName] = useState("");
  const [policyType, setPolicyType] = useState("custom");
  const [version, setVersion] = useState("1.0");
  const [status, setStatus] = useState("draft");

  // Custom sections (editabili)
  const [customPurpose, setCustomPurpose] = useState("");
  const [customPolicyStatement, setCustomPolicyStatement] = useState("");
  const [customProcedures, setCustomProcedures] = useState("");
  const [customExceptions, setCustomExceptions] = useState("");
  const [customNotes, setCustomNotes] = useState("");

  // ============ QUERY TO LOAD POLICY ============
  const { data: policy, isLoading } = useQuery({
    queryKey: ["policy", policyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("policies")
        .select("*")
        .eq("id", policyId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!policyId,
  });

  // ============ POPULATE STATE WHEN POLICY LOADS ============
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (policy && !hasUnsavedChanges) {
      setPolicyName(policy.policy_name || "");
      setPolicyType(policy.policy_type || "custom");
      setVersion(policy.version || "1.0");
      setStatus(policy.status || "draft");
      
      // AUTO-MIGRATE: Se i campi custom sono vuoti ma i campi legacy hanno dati, usa i legacy
      setCustomPurpose(policy.custom_purpose || policy.purpose || "");
      setCustomPolicyStatement(policy.custom_policy_statement || policy.policy_statement || "");
      setCustomProcedures(policy.custom_procedures || policy.procedures || "");
      setCustomExceptions(policy.custom_exceptions || "");
      setCustomNotes(policy.custom_notes || "");
    }
  }, [policy, hasUnsavedChanges]);

  // ============ SAVE MUTATION (NO RE-FETCH) ============
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("policies")
        .update({
          policy_name: policyName,
          policy_type: policyType,
          version: version,
          status: status,
          custom_purpose: customPurpose,
          custom_policy_statement: customPolicyStatement,
          custom_procedures: customProcedures,
          custom_exceptions: customExceptions,
          custom_notes: customNotes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", policyId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Policy salvata con successo!");
      
      // CRITICO: Marca come salvato PRIMA di qualsiasi altra azione
      setHasUnsavedChanges(false);
      
      // NON invalidare la query della policy corrente
      // Invalida SOLO la lista
      queryClient.invalidateQueries({ 
        queryKey: ["policies"],
        exact: false 
      });
      
      onSaved?.();
    },
    onError: (error: any) => {
      toast.error("Errore nel salvataggio: " + error.message);
    },
  });

  // ============ REGENERATE MUTATION ============
  const regenerateMutation = useMutation({
    mutationFn: async () => {
      if (!policy?.organization_id) {
        throw new Error("Nessuna organizzazione associata");
      }

      // 1. Fetch organization data
      const { data: org, error: orgError } = await supabase
        .from("organization")
        .select("*")
        .eq("id", policy.organization_id)
        .single();
      
      if (orgError) throw orgError;

      // 2. Fetch applicable controls from SoA
      const { data: controls, error: controlsError } = await supabase
        .from("soa_items")
        .select("control_reference, control_title, applicability")
        .eq("organization_id", policy.organization_id)
        .eq("applicability", "applicable");
      
      if (controlsError) throw controlsError;

      // 3. Generate sections
      const generatedScope = org?.isms_scope || "";
      const generatedControls = controls || [];
      const generatedRoles = {
        ciso: org?.ciso || "",
        dpo: org?.dpo || "",
        ceo: org?.ceo || "",
        cto: org?.cto || "",
        it_manager: org?.it_manager || "",
      };
      const generatedCompliance = [
        "ISO/IEC 27001:2022",
        ...(org?.applicable_regulations || [])
      ].join(", ");

      // 4. Update policy with generated sections
      const { error: updateError } = await supabase
        .from("policies")
        .update({
          generated_scope: generatedScope,
          generated_controls: generatedControls,
          generated_roles: generatedRoles,
          generated_compliance: generatedCompliance,
          last_auto_update: new Date().toISOString(),
        })
        .eq("id", policyId);
      
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast.success("Sezioni auto-generate aggiornate!");
      queryClient.invalidateQueries({ queryKey: ["policy", policyId] });
    },
    onError: (error: any) => {
      toast.error("Errore nell'aggiornamento: " + error.message);
    },
  });

  const handleSave = () => {
    saveMutation.mutate();
  };

  const handleRegenerate = () => {
    regenerateMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Caricamento policy...</div>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Policy non trovata</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <Alert variant="default" className="border-orange-500 bg-orange-50">
          <AlertDescription className="text-orange-800">
            Hai modifiche non salvate. Clicca "Salva Policy" per salvare le modifiche.
          </AlertDescription>
        </Alert>
      )}

      {/* Legacy Warning */}
      {policy?.is_legacy && (
        <Alert variant="default" className="border-yellow-500 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Questa è una policy del vecchio sistema. Considera di aggiornarla al nuovo formato 
            cliccando su "Aggiorna Sezioni Auto" nel tab "Sezioni Auto-Generate".
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">Informazioni Generali</TabsTrigger>
          <TabsTrigger value="generated">Sezioni Auto-Generate</TabsTrigger>
          <TabsTrigger value="custom">Contenuto Personalizzato</TabsTrigger>
        </TabsList>

        {/* TAB 1: INFORMAZIONI GENERALI */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informazioni Generali</CardTitle>
              <CardDescription>
                Dati principali della policy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="policy_name">Nome Policy *</Label>
                  <Input
                    id="policy_name"
                    value={policyName}
                    onChange={(e) => {
                      setPolicyName(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="es. Information Security Policy"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="policy_type">Tipo</Label>
                    <Select value={policyType} onValueChange={(value) => {
                      setPolicyType(value);
                      setHasUnsavedChanges(true);
                    }}>
                      <SelectTrigger id="policy_type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Custom</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="operational">Operational</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="version">Versione</Label>
                    <Input
                      id="version"
                      value={version}
                      onChange={(e) => {
                        setVersion(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="1.0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Stato</Label>
                  <Select value={status} onValueChange={(value) => {
                    setStatus(value);
                    setHasUnsavedChanges(true);
                  }}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Bozza</SelectItem>
                      <SelectItem value="active">Attiva</SelectItem>
                      <SelectItem value="archived">Archiviata</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: SEZIONI AUTO-GENERATE (READ-ONLY) */}
        <TabsContent value="generated" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Sezioni Auto-Generate
                  </CardTitle>
                  <CardDescription>
                    Contenuto generato automaticamente dai dati ISMS (read-only)
                  </CardDescription>
                </div>
                <Button 
                  onClick={handleRegenerate}
                  disabled={regenerateMutation.isPending}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${regenerateMutation.isPending ? 'animate-spin' : ''}`} />
                  Aggiorna Sezioni Auto
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Generated Scope */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Ambito ISMS</Label>
                  <Badge variant="secondary">Auto-generato</Badge>
                </div>
                <Textarea
                  value={policy.generated_scope || "Non ancora generato"}
                  disabled
                  className="bg-muted min-h-[100px]"
                />
              </div>

              <Separator />

              {/* Generated Controls */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Controlli Applicabili</Label>
                  <Badge variant="secondary">Auto-generato</Badge>
                </div>
                <div className="bg-muted p-4 rounded-md max-h-[200px] overflow-y-auto">
                  {policy.generated_controls && Array.isArray(policy.generated_controls) && policy.generated_controls.length > 0 ? (
                    <ul className="space-y-2">
                      {policy.generated_controls.map((control: any, idx: number) => (
                        <li key={idx} className="text-sm">
                          <strong>{control.control_reference}</strong>: {control.control_title}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nessun controllo generato</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Generated Roles */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Ruoli e Responsabilità</Label>
                  <Badge variant="secondary">Auto-generato</Badge>
                </div>
                <div className="bg-muted p-4 rounded-md">
                  {policy.generated_roles && typeof policy.generated_roles === 'object' ? (
                    <ul className="space-y-2">
                      {Object.entries(policy.generated_roles).map(([role, name]) => (
                        <li key={role} className="text-sm">
                          <strong className="uppercase">{role}</strong>: {String(name) || "Non assegnato"}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nessun ruolo generato</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Generated Compliance */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Riferimenti Normativi</Label>
                  <Badge variant="secondary">Auto-generato</Badge>
                </div>
                <Textarea
                  value={policy.generated_compliance || "Non ancora generato"}
                  disabled
                  className="bg-muted min-h-[80px]"
                />
              </div>

              {policy.last_auto_update && (
                <div className="text-sm text-muted-foreground">
                  Ultimo aggiornamento automatico: {new Date(policy.last_auto_update).toLocaleString('it-IT')}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: CONTENUTO PERSONALIZZATO (EDITABILE) */}
        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Contenuto Personalizzato
              </CardTitle>
              <CardDescription>
                Sezioni editabili specifiche per la tua organizzazione
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Custom Purpose */}
              <div className="space-y-2">
                <Label htmlFor="custom_purpose">Scopo e Obiettivi</Label>
                <Textarea
                  id="custom_purpose"
                  value={customPurpose}
                  onChange={(e) => {
                    setCustomPurpose(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="Descrivi lo scopo e gli obiettivi di questa policy..."
                  className="min-h-[120px]"
                />
              </div>

              <Separator />

              {/* Custom Policy Statement */}
              <div className="space-y-2">
                <Label htmlFor="custom_policy_statement">Dichiarazione Policy</Label>
                <Textarea
                  id="custom_policy_statement"
                  value={customPolicyStatement}
                  onChange={(e) => {
                    setCustomPolicyStatement(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="Inserisci la dichiarazione della policy..."
                  className="min-h-[120px]"
                />
              </div>

              <Separator />

              {/* Custom Procedures */}
              <div className="space-y-2">
                <Label htmlFor="custom_procedures">Procedure Specifiche</Label>
                <Textarea
                  id="custom_procedures"
                  value={customProcedures}
                  onChange={(e) => {
                    setCustomProcedures(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="Descrivi le procedure specifiche per implementare questa policy..."
                  className="min-h-[150px]"
                />
              </div>

              <Separator />

              {/* Custom Exceptions */}
              <div className="space-y-2">
                <Label htmlFor="custom_exceptions">Eccezioni e Casi Particolari</Label>
                <Textarea
                  id="custom_exceptions"
                  value={customExceptions}
                  onChange={(e) => {
                    setCustomExceptions(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="Documenta eventuali eccezioni o casi particolari..."
                  className="min-h-[100px]"
                />
              </div>

              <Separator />

              {/* Custom Notes */}
              <div className="space-y-2">
                <Label htmlFor="custom_notes">Note Aggiuntive</Label>
                <Textarea
                  id="custom_notes"
                  value={customNotes}
                  onChange={(e) => {
                    setCustomNotes(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="Aggiungi note o informazioni aggiuntive..."
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sticky Save Button */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t pt-4">
        <div className="flex justify-end gap-2">
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="min-w-[120px]"
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? 'Salvataggio...' : 'Salva Policy'}
          </Button>
        </div>
      </div>
    </div>
  );
}
