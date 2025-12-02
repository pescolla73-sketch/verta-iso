import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar } from "lucide-react";

export default function Audits() {
  const mockAudits = [
    {
      id: 1,
      name: "Audit Interno Q1 2025",
      type: "Interno",
      status: "Programmato",
      date: "15 Gennaio 2025",
      auditor: "Maria Ferrari",
      scope: "Tutti i controlli",
    },
    {
      id: 2,
      name: "Audit Esterno Certificazione",
      type: "Esterno",
      status: "In Corso",
      date: "20 Dicembre 2024",
      auditor: "Ente Certificatore XYZ",
      scope: "Annex A completo",
    },
    {
      id: 3,
      name: "Audit Interno Q4 2024",
      type: "Interno",
      status: "Completato",
      date: "15 Ottobre 2024",
      auditor: "Paolo Conti",
      scope: "Controlli tecnologici",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Programmato":
        return <Badge variant="outline">{status}</Badge>;
      case "In Corso":
        return <Badge className="bg-warning text-warning-foreground">{status}</Badge>;
      case "Completato":
        return <Badge className="bg-success text-success-foreground">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground">Gestione Audit</h1>
          <p className="text-muted-foreground mt-2">
            Pianifica e traccia gli audit di conformità
          </p>
        </div>
        <PermissionGuard resource="audits" action="create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nuovo Audit
          </Button>
        </PermissionGuard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="h-12 w-12 rounded-lg bg-warning/10 text-warning flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-6 w-6" />
              </div>
              <p className="text-3xl font-bold text-foreground">3</p>
              <p className="text-sm text-muted-foreground mt-2">
                Audit Programmati
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-6 w-6" />
              </div>
              <p className="text-3xl font-bold text-foreground">1</p>
              <p className="text-sm text-muted-foreground mt-2">
                Audit in Corso
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="h-12 w-12 rounded-lg bg-success/10 text-success flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-6 w-6" />
              </div>
              <p className="text-3xl font-bold text-foreground">8</p>
              <p className="text-sm text-muted-foreground mt-2">
                Audit Completati
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Lista Audit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockAudits.map((audit) => (
              <div
                key={audit.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-smooth cursor-pointer"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-foreground">
                      {audit.name}
                    </h3>
                    {getStatusBadge(audit.status)}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Data:</span> {audit.date}
                    </div>
                    <div>
                      <span className="font-medium">Auditor:</span>{" "}
                      {audit.auditor}
                    </div>
                    <div>
                      <span className="font-medium">Tipo:</span> {audit.type}
                    </div>
                    <div>
                      <span className="font-medium">Ambito:</span> {audit.scope}
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
