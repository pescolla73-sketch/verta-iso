import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Server, Monitor, Database, Users, Building } from "lucide-react";

export default function Assets() {
  const [searchQuery, setSearchQuery] = useState("");

  const assetTypes = [
    { name: "Hardware", count: 45, icon: Server, color: "text-primary" },
    { name: "Software", count: 38, icon: Monitor, color: "text-success" },
    { name: "Dati", count: 28, icon: Database, color: "text-warning" },
    { name: "Persone", count: 25, icon: Users, color: "text-destructive" },
    { name: "Servizi", count: 12, icon: Building, color: "text-primary" },
  ];

  const mockAssets = [
    {
      id: 1,
      name: "Server Produzione",
      type: "Hardware",
      owner: "IT Team",
      criticality: "Alta",
      lastReview: "2024-12-15",
    },
    {
      id: 2,
      name: "Database Clienti",
      type: "Dati",
      owner: "Data Team",
      criticality: "Critica",
      lastReview: "2024-12-20",
    },
    {
      id: 3,
      name: "Sistema ERP",
      type: "Software",
      owner: "Operations",
      criticality: "Alta",
      lastReview: "2024-12-10",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground">Inventario Asset</h1>
          <p className="text-muted-foreground mt-2">
            Gestisci tutti gli asset dell'organizzazione
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nuovo Asset
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {assetTypes.map((type) => (
          <Card key={type.name} className="shadow-card transition-smooth hover:shadow-elevated cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`${type.color}`}>
                  <type.icon className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {type.name}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {type.count}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista Asset</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca asset..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockAssets.map((asset) => (
              <div
                key={asset.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-smooth cursor-pointer"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{asset.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Proprietario: {asset.owner} • Ultima revisione:{" "}
                    {asset.lastReview}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{asset.type}</Badge>
                  <Badge
                    variant={
                      asset.criticality === "Critica"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {asset.criticality}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
