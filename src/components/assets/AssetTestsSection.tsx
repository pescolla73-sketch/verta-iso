import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isPast } from "date-fns";
import { it } from "date-fns/locale";
import { CheckCircle, XCircle, AlertTriangle, Clock, Play, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AssetTestsSectionProps {
  assetId: string;
  assetName: string;
}

export function AssetTestsSection({ assetId, assetName }: AssetTestsSectionProps) {
  const navigate = useNavigate();

  // Fetch tests for this asset
  const { data: tests = [], isLoading } = useQuery({
    queryKey: ["asset-tests-for-asset", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_tests")
        .select("*")
        .eq("asset_id", assetId)
        .eq("is_active", true)
        .order("next_due_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!assetId,
  });

  // Fetch recent executions for this asset
  const { data: executions = [] } = useQuery({
    queryKey: ["asset-test-executions-for-asset", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_test_executions")
        .select(`
          *,
          asset_tests (test_name)
        `)
        .eq("asset_id", assetId)
        .order("execution_date", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!assetId,
  });

  const overdueTests = tests.filter((t: any) => t.next_due_date && isPast(new Date(t.next_due_date)));
  const failedRecent = executions.filter((e: any) => e.result === "failed");

  const getResultBadge = (result: string) => {
    switch (result) {
      case "passed":
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Superato</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Fallito</Badge>;
      case "partial":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Parziale</Badge>;
      default:
        return <Badge variant="secondary">{result}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Test e Verifiche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={failedRecent.length > 0 || overdueTests.length > 0 ? "border-destructive" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            Test e Verifiche
            {(failedRecent.length > 0 || overdueTests.length > 0) && (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            )}
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/test-verifiche")}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Gestisci
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alert for issues */}
        {(failedRecent.length > 0 || overdueTests.length > 0) && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30">
            <div className="flex items-center gap-2 text-destructive font-medium text-sm">
              <AlertTriangle className="h-4 w-4" />
              {overdueTests.length > 0 && <span>{overdueTests.length} test scaduti</span>}
              {overdueTests.length > 0 && failedRecent.length > 0 && <span>•</span>}
              {failedRecent.length > 0 && <span>{failedRecent.length} test falliti recenti</span>}
            </div>
          </div>
        )}

        {/* Tests scheduled */}
        {tests.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">Nessun test pianificato per questo asset</p>
            <Button
              size="sm"
              variant="link"
              onClick={() => navigate("/test-verifiche")}
              className="mt-2"
            >
              Crea un test periodico
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Test Pianificati ({tests.length})
            </p>
            {tests.slice(0, 3).map((test: any) => {
              const isOverdue = test.next_due_date && isPast(new Date(test.next_due_date));
              return (
                <div
                  key={test.id}
                  className={`flex items-center justify-between p-2 rounded-md border ${
                    isOverdue ? "border-destructive bg-destructive/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isOverdue ? (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{test.test_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {test.next_due_date
                          ? format(new Date(test.next_due_date), "dd/MM/yyyy", { locale: it })
                          : "Da pianificare"}
                      </p>
                    </div>
                  </div>
                  <Badge variant={isOverdue ? "destructive" : "secondary"}>
                    {isOverdue ? "Scaduto" : test.test_type}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}

        {/* Recent executions */}
        {executions.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-sm font-medium text-muted-foreground">Ultime Esecuzioni</p>
            {executions.slice(0, 3).map((exec: any) => (
              <div key={exec.id} className="flex items-center justify-between text-sm">
                <span>{exec.asset_tests?.test_name || "Test"}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {format(new Date(exec.execution_date), "dd/MM/yy")}
                  </span>
                  {getResultBadge(exec.result)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
