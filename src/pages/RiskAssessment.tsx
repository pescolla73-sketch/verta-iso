import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Search, AlertTriangle, Info as InfoIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { RiskWizard } from "@/components/risk/RiskWizard";
import { RiskMatrix } from "@/components/risk/RiskMatrix";
import { Skeleton } from "@/components/ui/skeleton";
import { getRiskBadgeVariant, RiskCategory } from "@/utils/riskCalculation";

export default function RiskAssessment() {
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | undefined>();

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
    return matchesSearch && matchesLevel && matchesStatus;
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

  // Fetch assets for selection
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
    setIsWizardOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            Valutazione Rischi Semplificata
          </h1>
          <p className="text-muted-foreground mt-2">
            Rispondi a domande semplici e ottieni una valutazione professionale
          </p>
        </div>
      </div>

      {/* Asset Selection Section */}
      {assets.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Seleziona un Asset da Valutare</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Clicca su un asset per iniziare la valutazione guidata (5-10 minuti)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assets.map(asset => {
                const assetRisks = filteredRisks?.filter(r => r.asset_id === asset.id) || [];
                const hasRisk = assetRisks.length > 0;
                
                return (
                  <Card
                    key={asset.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      hasRisk && "border-green-500"
                    )}
                    onClick={() => handleAssetSelect(asset.id)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{asset.name}</h3>
                          <p className="text-sm text-muted-foreground">{asset.asset_type}</p>
                        </div>
                        {hasRisk ? (
                          <Badge variant="outline" className="bg-green-100">
                            ✓ Valutato
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            Da valutare
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {assets.length === 0 && (
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            <strong>Nessun asset trovato.</strong>
            <br />
            Prima di valutare i rischi, devi creare almeno un asset.
            <Button variant="link" className="p-0 h-auto ml-1" onClick={() => window.location.href = '/assets'}>
              Vai agli Asset →
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Risk Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-card border-red-500/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="text-red-500">
                <div className="text-4xl">🔴</div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critici</p>
                <p className="text-3xl font-bold text-foreground">{riskStats.critical}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-orange-500/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="text-orange-500">
                <div className="text-4xl">🟠</div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Alti</p>
                <p className="text-3xl font-bold text-foreground">{riskStats.high}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-yellow-500/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="text-yellow-500">
                <div className="text-4xl">🟡</div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Medi</p>
                <p className="text-3xl font-bold text-foreground">{riskStats.medium}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-green-500/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="text-green-500">
                <div className="text-4xl">🟢</div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bassi</p>
                <p className="text-3xl font-bold text-foreground">{riskStats.low}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Matrix Heatmap */}
      {risks && risks.length > 0 && (
        <RiskMatrix
          risks={risks}
          onCellClick={(probability, impact, cellRisks) => {
            console.log("Clicked cell:", { probability, impact, risks: cellRisks });
            // TODO: Show modal with risks in this cell
          }}
        />
      )}

      {/* Filters and Table */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <CardTitle>Registro Rischi</CardTitle>
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca rischi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-full md:w-40">
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
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli status</SelectItem>
                  <SelectItem value="Identificato">Identificato</SelectItem>
                  <SelectItem value="In trattamento">In trattamento</SelectItem>
                  <SelectItem value="Trattato">Trattato</SelectItem>
                  <SelectItem value="Accettato">Accettato</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredRisks && filteredRisks.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nome Rischio</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Livello</TableHead>
                    <TableHead>Trattamento</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRisks.map((risk) => (
                    <TableRow key={risk.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">{risk.risk_id}</TableCell>
                      <TableCell className="font-medium">{risk.name}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{risk.assets?.name || "-"}</p>
                          <p className="text-xs text-muted-foreground">
                            {risk.assets?.asset_type}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center font-bold text-lg">
                          {risk.inherent_risk_score}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRiskBadgeVariant(risk.inherent_risk_level as RiskCategory)}>
                          {risk.inherent_risk_level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{risk.treatment_strategy || "-"}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(risk.status)}>
                          {risk.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || levelFilter !== "all" || statusFilter !== "all"
                  ? "Nessun rischio trovato con i filtri selezionati"
                  : "Nessun rischio registrato. Inizia la valutazione dei rischi."}
              </p>
              {!searchQuery && levelFilter === "all" && statusFilter === "all" && (
                <Button className="mt-4" onClick={() => setIsWizardOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Valuta Primo Rischio
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {isWizardOpen && (
        <RiskWizard
          open={isWizardOpen}
          onOpenChange={(open) => {
            setIsWizardOpen(open);
            if (!open) setSelectedAssetId(undefined);
          }}
          assetId={selectedAssetId}
        />
      )}
    </div>
  );
}