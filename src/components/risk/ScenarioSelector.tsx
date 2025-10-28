import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { scenarioCategories } from "@/data/scenarioLibrary";

interface ScenarioSelectorProps {
  onScenarioSelect: (scenarioId: string) => void;
}

export function ScenarioSelector({ onScenarioSelect }: ScenarioSelectorProps) {
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🌍</span>
          Valutazione Rischi per Scenario
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-6">
          Valuta rischi che impattano l'intera organizzazione o più asset contemporaneamente
        </p>

        <div className="space-y-6">
          {Object.entries(scenarioCategories).map(([categoryKey, category]) => (
            <div key={categoryKey}>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <span className="text-2xl">{category.icon}</span>
                {category.name}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {category.scenarios.map((scenario) => (
                  <Card
                    key={scenario.id}
                    className="cursor-pointer transition-all hover:shadow-md hover:border-primary"
                    onClick={() => onScenarioSelect(scenario.id)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{scenario.icon}</span>
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">{scenario.name}</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {scenario.description}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-xs">
                              Prob: {scenario.typical_probability}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Impatto: {scenario.typical_impact}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {scenario.scope}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}