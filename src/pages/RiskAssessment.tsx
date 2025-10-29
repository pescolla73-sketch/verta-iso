import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, AlertTriangle, Info as InfoIcon, Pencil, Trash2, Eye } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { RiskWizard } from "@/components/risk/RiskWizard";
import { RiskMatrix } from "@/components/risk/RiskMatrix";
import { ScenarioSelector } from "@/components/risk/ScenarioSelector";
import { ThreatLibraryBrowser } from "@/components/risk/ThreatLibraryBrowser";
import { ThreatEvaluationDialog } from "@/components/risk/ThreatEvaluationDialog";
import { CustomThreatDialog } from "@/components/risk/CustomThreatDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getRiskBadgeVariant, RiskCategory } from "@/utils/riskCalculation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RiskAssessment() {
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardMode, setWizardMode] = useState<'asset' | 'scenario'>('asset');
  const [selectedAssetId, setSelectedAssetId] = useState<string | undefined>();
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | undefined>();
  const [selectedThreatId, setSelectedThreatId] = useState<string | null>(null);
  const [showThreatEvaluation, setShowThreatEvaluation] = useState(false);
  const [showCustomThreatDialog, setShowCustomThreatDialog] = useState(false);
  const [editingRisk, setEditingRisk] = useState<any>(null);
  const [riskToDelete, setRiskToDelete] = useState<any>(null);
  const [showDeleteRiskConfirm, setShowDeleteRiskConfirm] = useState(false);

  // Define filter options
  const LEVEL_OPTIONS = [
    { value: "all", label: "Tutti i livelli" },
    { value: "Critico", label: "Critico" },
    { value: "Alto", label: "Alto" },
    { value: "Medio", label: "Medio" },
    { value: "Basso", label: "Basso" },
  ];

  const STATUS_OPTIONS = [
    { value: "all", label: "Tutti gli stati" },
    { value: "Identificato", label: "Identificato" },
    { value: "In trattamento", label: "In trattamento" },
    { value: "Trattato", label: "Trattato" },
    { value: "Accettato", label: "Accettato" },
  ];

  const TYPE_OPTIONS = [
    { value: "all", label: "Tutti i tipi" },
    { value: "asset-specific", label: "Asset-specific" },
    { value: "scenario", label: "Scenario" },
  ];

  const { data: risks, isLoading } = useQuery({
    queryKey: ["risks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risks")
        .select("*, assets(name, asset_type)")
        .order("inherent_risk_score", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredRisks = risks?.filter((risk) => {
    const matchesSearch =
      risk.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      risk.risk_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === "all" || risk.inherent_risk_level === levelFilter;
    const matchesStatus = statusFilter === "all" || risk.status === statusFilter;
    const matchesType = typeFilter === "all" || risk.risk_type === typeFilter;
    return matchesSearch && matchesLevel && matchesStatus && matchesType;
  });

  const riskStats = {
    critical: risks?.filter((r) => r.inherent_risk_level === "Critico").length || 0,
    high: risks?.filter((r) => r.inherent_risk_level === "Alto").length || 0,
    medium: risks?.filter((r) => r.inherent_risk_level === "Medio").length || 0,
    low: risks?.filter((r) => r.inherent_risk_level === "Basso").length || 0,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Identificato":
        return "destructive";
      case "In trattamento":
        return "default";
      case "Trattato":
        return "secondary";
      case "Accettato":
        return "outline";
      default:
        return "secondary";
    }
  };

  const { data: assets = [] } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data || [];
    }
  });

  const handleAssetSelect = (assetId: string) => {
    setSelectedAssetId(assetId);
    setWizardMode('asset');
    setIsWizardOpen(true);
  };

  const handleScenarioSelect = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    setWizardMode('scenario');
    setIsWizardOpen(true);
  };

  const handleThreatSelect = (threatId: string) => {
    setSelectedThreatId(threatId);
    setShowThreatEvaluation(true);
  };

  const handleCustomThreatCreated = (threatId: string) => {
    if (threatId) {
      setSelectedThreatId(threatId);
      setShowThreatEvaluation(true);
    }
  };

  const queryClient = useQueryClient();

  const handleEditRisk = (risk: any) => {
    setEditingRisk(risk);
    setSelectedThreatId(risk.threat_id);
    setShowThreatEvaluation(true);
  };

  const handleDeleteRisk = async (risk: any) => {
    setRiskToDelete(risk);
    setShowDeleteRiskConfirm(true);
  };

  const deleteRiskMutation = useMutation({
    mutationFn: async (riskId: string) => {
      const { error } = await supabase
        .from('risks')
        .delete()
        .eq('id', riskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risks'] });
      toast.success('🗑️ Rischio eliminato');
      setShowDeleteRiskConfirm(false);
      setRiskToDelete(null);
    },
    onError: (error: any) => {
      console.error('Delete error:', error);
      toast.error('Errore nell\'eliminazione: ' + error.message);
    }
  });

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Risk Assessment</h1>
          <p className="text-muted-foreground">
            Gestione completa dei rischi ISO 27001 + NIS2
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {risks?.length || 0} rischi totali
        </Badge>
      </div>

      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          Sistema di valutazione rischi conforme a ISO 27001:2022 e Direttiva NIS2 (EU 2022/2555)
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Valuta Nuovi Rischi</h2>
            <Button onClick={() => setShowCustomThreatDialog(true)} variant="outline">
              ✍️ Crea Minaccia Personalizzata
            </Button>
          </div>
          <Tabs defaultValue="threat-library" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="threat-library">📚 Libreria Minacce</TabsTrigger>
              <TabsTrigger value="asset">📦 Per Asset</TabsTrigger>
              <TabsTrigger value="scenario">🌍 Per Scenario</TabsTrigger>
            </TabsList>
            
            <TabsContent value="threat-library" className="space-y-4">
              <ThreatLibraryBrowser onSelectThreat={handleThreatSelect} />
            </TabsContent>

            <TabsContent value="asset" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Valutazione Rischi per Asset</CardTitle>
                  <CardDescription>
                    Seleziona un asset specifico per valutarne i rischi
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {assets?.map((asset) => (
                      <Card key={asset.id} className="cursor-pointer hover:bg-accent" onClick={() => handleAssetSelect(asset.id)}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{asset.name}</p>
                              <p className="text-sm text-muted-foreground">{asset.asset_type}</p>
                            </div>
                            <Badge>{asset.criticality}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="scenario" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Valutazione Rischi per Scenario</CardTitle>
                  <CardDescription>
                    Seleziona uno scenario di rischio generale
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScenarioSelector onScenarioSelect={handleScenarioSelect} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Rischi Critici</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{riskStats.critical}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Rischi Alti</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{riskStats.high}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Rischi Medi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{riskStats.medium}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Rischi Bassi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{riskStats.low}</div>
            </CardContent>
          </Card>
        </div>

        <RiskMatrix risks={risks || []} />

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Registro Rischi</CardTitle>
                <CardDescription>
                  {filteredRisks?.length || 0} rischi registrati
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cerca rischi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Livello" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i livelli</SelectItem>
                    <SelectItem value="Critico">Critico</SelectItem>
                    <SelectItem value="Alto">Alto</SelectItem>
                    <SelectItem value="Medio">Medio</SelectItem>
                    <SelectItem value="Basso">Basso</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Stato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti gli stati</SelectItem>
                    <SelectItem value="Identificato">Identificato</SelectItem>
                    <SelectItem value="In trattamento">In trattamento</SelectItem>
                    <SelectItem value="Trattato">Trattato</SelectItem>
                    <SelectItem value="Accettato">Accettato</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i tipi</SelectItem>
                    <SelectItem value="asset-specific">Asset-specific</SelectItem>
                    <SelectItem value="scenario">Scenario</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nome Rischio</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Ambito</TableHead>
                      <TableHead className="text-center">Inerente</TableHead>
                      <TableHead className="text-center">Residuo</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8}>
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredRisks?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          Nessun rischio trovato
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRisks?.map((risk) => (
                        <TableRow key={risk.id}>
                          <TableCell className="font-mono text-xs">{risk.risk_id}</TableCell>
                          <TableCell>
                            <div className="font-medium">{risk.name}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {risk.description}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{risk.risk_type}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{risk.scope || 'N/A'}</TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={getRiskBadgeVariant(
                                risk.inherent_risk_level as RiskCategory
                              )}
                            >
                              {risk.inherent_risk_level} ({risk.inherent_risk_score})
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={getRiskBadgeVariant(
                                risk.residual_risk_level as RiskCategory
                              )}
                            >
                              {risk.residual_risk_level} ({risk.residual_risk_score})
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadge(risk.status) as any}>
                              {risk.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditRisk(risk)}
                                title="Modifica rischio"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteRisk(risk)}
                                title="Elimina rischio"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <RiskWizard
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        assetId={selectedAssetId}
        scenarioId={selectedScenarioId}
        mode={wizardMode}
      />

      <ThreatEvaluationDialog
        open={showThreatEvaluation}
        onOpenChange={(open) => {
          setShowThreatEvaluation(open);
          if (!open) setEditingRisk(null);
        }}
        threatId={selectedThreatId}
        initialRiskData={editingRisk}
      />

      <CustomThreatDialog
        open={showCustomThreatDialog}
        onOpenChange={setShowCustomThreatDialog}
        onThreatCreated={handleCustomThreatCreated}
      />

      <AlertDialog open={showDeleteRiskConfirm} onOpenChange={setShowDeleteRiskConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>🗑️ Eliminare questa valutazione rischio?</AlertDialogTitle>
            <AlertDialogDescription>
              Stai per eliminare:
              <div className="mt-2 p-3 bg-muted rounded">
                <strong>{riskToDelete?.risk_id}</strong>: {riskToDelete?.name}
              </div>
              
              {riskToDelete?.related_controls?.length > 0 && (
                <div className="mt-2 p-2 bg-warning/10 border border-warning rounded">
                  ⚠️ Questo rischio è collegato a {riskToDelete.related_controls.length} controlli.
                  I collegamenti saranno rimossi.
                </div>
              )}
              
              <p className="mt-2">
                Questa azione è <strong>irreversibile</strong>.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>❌ Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => riskToDelete && deleteRiskMutation.mutate(riskToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              🗑️ Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
