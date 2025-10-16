import { Shield, Box, AlertTriangle, CheckCircle } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ComplianceChart } from "@/components/dashboard/ComplianceChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  // Mock data - sarà sostituito con dati reali dal database
  const stats = {
    totalControls: 93,
    compliantControls: 45,
    partialControls: 28,
    nonCompliantControls: 20,
    totalAssets: 156,
    activeAudits: 3,
    pendingActions: 12,
  };

  const recentActivities = [
    {
      id: 1,
      action: "Controllo A.5.1 aggiornato",
      user: "Marco Rossi",
      time: "2 ore fa",
      status: "success" as const,
    },
    {
      id: 2,
      action: "Nuovo asset aggiunto",
      user: "Laura Bianchi",
      time: "5 ore fa",
      status: "info" as const,
    },
    {
      id: 3,
      action: "Audit programmato",
      user: "Giuseppe Verdi",
      time: "1 giorno fa",
      status: "warning" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Panoramica dello stato di conformità ISO 27001:2022
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Controlli Totali"
          value={stats.totalControls}
          icon={Shield}
          variant="default"
        />
        <StatCard
          title="Conformi"
          value={stats.compliantControls}
          icon={CheckCircle}
          variant="success"
          trend={{ value: "+5 questo mese", positive: true }}
        />
        <StatCard
          title="Asset Totali"
          value={stats.totalAssets}
          icon={Box}
          variant="default"
        />
        <StatCard
          title="Azioni Pendenti"
          value={stats.pendingActions}
          icon={AlertTriangle}
          variant="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ComplianceChart
            totalControls={stats.totalControls}
            compliantControls={stats.compliantControls}
            partialControls={stats.partialControls}
            nonCompliantControls={stats.nonCompliantControls}
          />
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Attività Recenti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0"
                >
                  <Badge
                    variant={
                      activity.status === "success"
                        ? "default"
                        : activity.status === "warning"
                        ? "secondary"
                        : "outline"
                    }
                    className="mt-1"
                  >
                    {activity.status}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.user} • {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Distribuzione Controlli per Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Controlli Organizzativi", value: 37, total: 93 },
                { name: "Controlli Persone", value: 8, total: 93 },
                { name: "Controlli Fisici", value: 14, total: 93 },
                { name: "Controlli Tecnologici", value: 34, total: 93 },
              ].map((category) => (
                <div key={category.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{category.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {category.value}/{category.total}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-smooth"
                      style={{
                        width: `${(category.value / category.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Prossimi Audit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  name: "Audit Interno Q1",
                  date: "15 Gen 2025",
                  auditor: "Maria Ferrari",
                },
                {
                  name: "Revisione Politiche",
                  date: "22 Gen 2025",
                  auditor: "Paolo Conti",
                },
                {
                  name: "Verifica Asset IT",
                  date: "5 Feb 2025",
                  auditor: "Francesca Russo",
                },
              ].map((audit) => (
                <div
                  key={audit.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium text-sm">{audit.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Auditor: {audit.auditor}
                    </p>
                  </div>
                  <Badge variant="outline">{audit.date}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
