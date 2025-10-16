import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileText } from "lucide-react";
import { useState } from "react";

export default function Policies() {
  const [searchQuery, setSearchQuery] = useState("");

  const mockPolicies = [
    {
      id: 1,
      name: "Politica di Sicurezza delle Informazioni",
      version: "v2.1",
      status: "Approvata",
      approvedBy: "CEO",
      lastReview: "2024-12-01",
      nextReview: "2025-06-01",
    },
    {
      id: 2,
      name: "Politica di Gestione degli Accessi",
      version: "v1.5",
      status: "In Revisione",
      approvedBy: "CISO",
      lastReview: "2024-11-15",
      nextReview: "2025-05-15",
    },
    {
      id: 3,
      name: "Politica di Backup e Recovery",
      version: "v1.2",
      status: "Approvata",
      approvedBy: "CTO",
      lastReview: "2024-10-20",
      nextReview: "2025-04-20",
    },
    {
      id: 4,
      name: "Politica di Risposta agli Incidenti",
      version: "v1.0",
      status: "Bozza",
      approvedBy: "-",
      lastReview: "-",
      nextReview: "-",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approvata":
        return <Badge className="bg-success text-success-foreground">{status}</Badge>;
      case "In Revisione":
        return <Badge className="bg-warning text-warning-foreground">{status}</Badge>;
      case "Bozza":
        return <Badge variant="outline">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground">Gestione Politiche</h1>
          <p className="text-muted-foreground mt-2">
            Documenta e gestisci le politiche di sicurezza
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nuova Politica
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Totali", value: 12, variant: "default" },
          { label: "Approvate", value: 8, variant: "success" },
          { label: "In Revisione", value: 3, variant: "warning" },
          { label: "Bozze", value: 1, variant: "outline" },
        ].map((stat) => (
          <Card key={stat.label} className="shadow-card">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-6 w-6" />
                </div>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {stat.label}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista Politiche</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca politiche..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockPolicies.map((policy) => (
              <div
                key={policy.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-smooth cursor-pointer"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-foreground">
                      {policy.name}
                    </h3>
                    {getStatusBadge(policy.status)}
                    <Badge variant="outline">{policy.version}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Approvata da:</span>{" "}
                      {policy.approvedBy}
                    </div>
                    <div>
                      <span className="font-medium">Ultima revisione:</span>{" "}
                      {policy.lastReview}
                    </div>
                    <div>
                      <span className="font-medium">Prossima revisione:</span>{" "}
                      {policy.nextReview}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
