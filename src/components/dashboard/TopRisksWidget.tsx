import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import { getRiskBadgeVariant, RiskCategory } from "@/utils/riskCalculation";

export function TopRisksWidget() {
  const navigate = useNavigate();

  const { data: topRisks, isLoading } = useQuery({
    queryKey: ["top-risks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risks")
        .select("*, assets(name)")
        .order("inherent_risk_score", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Top Rischi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          ⚠️ Top Rischi
        </CardTitle>
      </CardHeader>
      <CardContent>
        {topRisks && topRisks.length > 0 ? (
          <div className="space-y-3">
            {topRisks.map((risk) => (
              <div
                key={risk.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-smooth cursor-pointer"
                onClick={() => navigate("/risk-assessment")}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{risk.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {risk.assets?.name || "Asset non specificato"}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <div className="text-center">
                    <div className="text-lg font-bold">{risk.inherent_risk_score}</div>
                  </div>
                  <Badge variant={getRiskBadgeVariant(risk.inherent_risk_level as RiskCategory)}>
                    {risk.inherent_risk_level}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nessun rischio registrato</p>
            <p className="text-xs mt-1">Inizia la valutazione dei rischi</p>
          </div>
        )}
        <Button
          variant="link"
          className="w-full mt-4"
          onClick={() => navigate("/risk-assessment")}
        >
          Vedi tutti i rischi →
        </Button>
      </CardContent>
    </Card>
  );
}