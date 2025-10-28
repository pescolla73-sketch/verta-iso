import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getRiskCellColor, RISK_LEVELS, RiskLevel } from "@/utils/riskCalculation";

interface RiskMatrixProps {
  risks: any[];
  onCellClick?: (probability: number, impact: number, risks: any[]) => void;
}

export function RiskMatrix({ risks, onCellClick }: RiskMatrixProps) {
  const getRisksForCell = (probability: number, impact: number) => {
    return risks.filter((risk) => {
      const probScore = RISK_LEVELS[risk.inherent_probability as RiskLevel];
      const impactScore = RISK_LEVELS[risk.inherent_impact as RiskLevel];
      return probScore === probability && impactScore === impact;
    });
  };

  const probabilityLabels = ["VA", "A", "M", "B", "VB"];
  const impactLabels = ["VB", "B", "M", "A", "VA"];

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎯 Risk Matrix (Heatmap)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Clicca su una cella per vedere i rischi in quella categoria
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-grid" style={{ gridTemplateColumns: "auto repeat(5, minmax(60px, 1fr))" }}>
            {/* Header row */}
            <div className="p-2" />
            {impactLabels.map((label) => (
              <div key={label} className="p-2 text-center text-sm font-medium">
                {label}
              </div>
            ))}

            {/* Matrix rows */}
            {probabilityLabels.map((probLabel, probIndex) => {
              const probability = 5 - probIndex; // 5, 4, 3, 2, 1

              return (
                <>
                  {/* Row label */}
                  <div key={`label-${probLabel}`} className="p-2 text-sm font-medium flex items-center">
                    {probLabel}
                  </div>

                  {/* Row cells */}
                  {[1, 2, 3, 4, 5].map((impact) => {
                    const score = probability * impact;
                    const cellRisks = getRisksForCell(probability, impact);
                    const hasRisks = cellRisks.length > 0;

                    return (
                      <div
                        key={`${probability}-${impact}`}
                        className={cn(
                          "aspect-square min-h-[60px] rounded-lg cursor-pointer relative border-2",
                          "hover:ring-2 hover:ring-primary hover:scale-105 transition-all duration-200",
                          "flex items-center justify-center",
                          getRiskCellColor(score)
                        )}
                        onClick={() => onCellClick?.(probability, impact, cellRisks)}
                      >
                        <div className="text-center">
                          <div className="text-xl font-bold">{score}</div>
                          {hasRisks && (
                            <Badge className="absolute top-1 right-1 text-xs px-1.5">
                              {cellRisks.length}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              );
            })}

            {/* Labels */}
            <div className="col-span-6 mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">↑ Probabilità</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Impatto →</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span className="text-sm">Basso (1-6)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500" />
            <span className="text-sm">Medio (7-12)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-500" />
            <span className="text-sm">Alto (13-16)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span className="text-sm">Critico (17-25)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}