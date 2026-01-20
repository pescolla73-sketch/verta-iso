import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Shield, CheckCircle, XCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AssetRisksSectionProps {
  assetId: string;
  assetName: string;
  relatedControls?: string[];
}

export function AssetRisksSection({ assetId, assetName, relatedControls = [] }: AssetRisksSectionProps) {
  // Fetch risks associated with this asset
  const { data: risks = [], isLoading: risksLoading } = useQuery({
    queryKey: ["asset-risks", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risks")
        .select("*")
        .eq("asset_id", assetId)
        .order("inherent_risk_score", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!assetId
  });

  // Fetch control statuses for related controls
  const { data: controls = [], isLoading: controlsLoading } = useQuery({
    queryKey: ["asset-controls", relatedControls],
    queryFn: async () => {
      if (!relatedControls || relatedControls.length === 0) return [];
      
      const { data, error } = await supabase
        .from("controls")
        .select("control_id, title, status")
        .in("control_id", relatedControls);
      
      if (error) throw error;
      return data || [];
    },
    enabled: relatedControls && relatedControls.length > 0
  });

  const getRiskLevelBadge = (level: string) => {
    switch (level) {
      case "Critico":
        return <Badge variant="destructive">{level}</Badge>;
      case "Alto":
        return <Badge className="bg-orange-500">{level}</Badge>;
      case "Medio":
        return <Badge className="bg-yellow-500">{level}</Badge>;
      case "Basso":
        return <Badge variant="secondary">{level}</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  const getControlStatusIcon = (status: string | null) => {
    switch (status) {
      case "Implementato":
      case "implemented":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "Parziale":
      case "partial":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "Non implementato":
      case "not_implemented":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const isLoading = risksLoading || controlsLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Rischi e Controlli
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Rischi e Controlli Associati
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Risks Section */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Rischi Identificati ({risks.length})
          </h4>
          {risks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nessun rischio identificato per questo asset.
            </p>
          ) : (
            <div className="space-y-2">
              {risks.map((risk) => (
                <div
                  key={risk.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{risk.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {risk.risk_id} • {risk.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRiskLevelBadge(risk.inherent_risk_level)}
                    {risk.residual_risk_level && (
                      <span className="text-xs text-muted-foreground">
                        → {risk.residual_risk_level}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Controls Section */}
        {relatedControls && relatedControls.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Stato Controlli ISO 27001 ({controls.length})
            </h4>
            <div className="space-y-2">
              {controls.map((control) => (
                <div
                  key={control.control_id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    {getControlStatusIcon(control.status)}
                    <div>
                      <p className="font-medium text-sm">{control.control_id}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {control.title}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {control.status || "Non definito"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        {(risks.length > 0 || controls.length > 0) && (
          <div className="pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 rounded-lg bg-accent/50">
                <p className="text-2xl font-bold text-destructive">
                  {risks.filter(r => r.inherent_risk_level === "Critico" || r.inherent_risk_level === "Alto").length}
                </p>
                <p className="text-xs text-muted-foreground">Rischi Alti/Critici</p>
              </div>
              <div className="p-3 rounded-lg bg-accent/50">
                <p className="text-2xl font-bold text-green-600">
                  {controls.filter(c => c.status === "Implementato" || c.status === "implemented").length}/{controls.length}
                </p>
                <p className="text-xs text-muted-foreground">Controlli Implementati</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
