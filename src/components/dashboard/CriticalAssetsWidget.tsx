import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function CriticalAssetsWidget() {
  const navigate = useNavigate();

  const { data: criticalAssets, isLoading } = useQuery({
    queryKey: ["critical-assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .in("criticality", ["Critico", "Alto"])
        .eq("status", "Attivo")
        .order("criticality", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Hardware":
        return "💻";
      case "Software":
        return "📱";
      case "Data":
        return "💾";
      case "Service":
        return "☁️";
      case "People":
        return "👥";
      default:
        return "📦";
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">📦 Asset Critici</CardTitle>
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
        <CardTitle className="text-lg">📦 Asset Critici</CardTitle>
      </CardHeader>
      <CardContent>
        {criticalAssets && criticalAssets.length > 0 ? (
          <div className="space-y-3">
            {criticalAssets.map((asset) => (
              <div
                key={asset.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-smooth cursor-pointer"
                onClick={() => navigate("/assets")}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getTypeIcon(asset.asset_type)}</span>
                  <div>
                    <p className="font-medium text-sm">{asset.name}</p>
                    <p className="text-xs text-muted-foreground">{asset.asset_id}</p>
                  </div>
                </div>
                <Badge variant={asset.criticality === "Critico" ? "destructive" : "default"}>
                  {asset.criticality}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">Nessun asset critico registrato</p>
          </div>
        )}
        <Button
          variant="link"
          className="w-full mt-4"
          onClick={() => navigate("/assets")}
        >
          Vedi tutti gli asset →
        </Button>
      </CardContent>
    </Card>
  );
}