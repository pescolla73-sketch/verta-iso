import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ComplianceChartProps {
  totalControls: number;
  compliantControls: number;
  partialControls: number;
  nonCompliantControls: number;
}

export function ComplianceChart({
  totalControls,
  compliantControls,
  partialControls,
  nonCompliantControls,
}: ComplianceChartProps) {
  const compliancePercentage = Math.round(
    (compliantControls / totalControls) * 100
  );

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Stato di Conformità</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-5xl font-bold gradient-primary bg-clip-text text-transparent">
              {compliancePercentage}%
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Conformità Complessiva
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Conformi</span>
                <span className="text-sm text-muted-foreground">
                  {compliantControls}/{totalControls}
                </span>
              </div>
              <Progress
                value={(compliantControls / totalControls) * 100}
                className="h-2 bg-muted"
                indicatorClassName="bg-success"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Parzialmente Conformi</span>
                <span className="text-sm text-muted-foreground">
                  {partialControls}/{totalControls}
                </span>
              </div>
              <Progress
                value={(partialControls / totalControls) * 100}
                className="h-2 bg-muted"
                indicatorClassName="bg-warning"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Non Conformi</span>
                <span className="text-sm text-muted-foreground">
                  {nonCompliantControls}/{totalControls}
                </span>
              </div>
              <Progress
                value={(nonCompliantControls / totalControls) * 100}
                className="h-2 bg-muted"
                indicatorClassName="bg-destructive"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
