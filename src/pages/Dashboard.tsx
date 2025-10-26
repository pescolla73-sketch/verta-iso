import { Shield, CheckCircle, AlertCircle, TrendingUp, Download, Plus, Settings, Bell, FileDown } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { format, addMonths } from "date-fns";
import { it } from "date-fns/locale";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export default function Dashboard() {
  const navigate = useNavigate();

  // Fetch real controls data
  const { data: controls, isLoading } = useQuery({
    queryKey: ["controls"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("controls")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  // Calculate statistics
  const stats = {
    totalControls: controls?.length || 93,
    implemented: controls?.filter((c) => c.status === "implemented").length || 0,
    partial: controls?.filter((c) => c.status === "partial").length || 0,
    notImplemented: controls?.filter((c) => c.status === "not_implemented").length || 0,
    notApplicable: controls?.filter((c) => c.status === "not_applicable").length || 0,
  };

  // Pie chart data
  const pieChartData = [
    { name: "Implementati", value: stats.implemented, color: "#22c55e" },
    { name: "Parzialmente Implementati", value: stats.partial, color: "#f59e0b" },
    { name: "Non Implementati", value: stats.notImplemented, color: "#ef4444" },
    { name: "Non Applicabili", value: stats.notApplicable, color: "#6b7280" },
  ].filter((item) => item.value > 0);

  const implementedPercentage = Math.round((stats.implemented / stats.totalControls) * 100);
  const partialPercentage = Math.round((stats.partial / stats.totalControls) * 100);
  const gapPercentage = Math.round((stats.notImplemented / stats.totalControls) * 100);

  // Domain breakdown
  const domains = [
    { name: "Organizzativi", prefix: "5", color: "bg-primary" },
    { name: "Persone", prefix: "6", color: "bg-success" },
    { name: "Fisici", prefix: "7", color: "bg-warning" },
    { name: "Tecnologici", prefix: "8", color: "bg-destructive" },
  ];

  const domainStats = domains.map((domain) => {
    const domainControls = controls?.filter((c) => c.control_id.startsWith(domain.prefix)) || [];
    const implemented = domainControls.filter((c) => c.status === "implemented").length;
    const total = domainControls.length;
    const percentage = total > 0 ? Math.round((implemented / total) * 100) : 0;
    return { ...domain, implemented, total, percentage };
  });

  // Overall compliance
  const overallCompliance = Math.round(
    ((stats.implemented + stats.partial * 0.5) / stats.totalControls) * 100
  );

  // Next review date (6 months from now)
  const nextReviewDate = format(addMonths(new Date(), 6), "dd/MM/yyyy", { locale: it });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Caricamento dati...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard Conformità ISO 27001</h1>
        <p className="text-muted-foreground mt-2">
          Panoramica dello stato di implementazione dei controlli
        </p>
      </div>

      {/* 4 Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Controlli Totali"
          value={stats.totalControls}
          icon={Shield}
          variant="default"
        />
        <StatCard
          title="Implementati"
          value={`${stats.implemented} (${implementedPercentage}%)`}
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title="Parzialmente Implementati"
          value={`${stats.partial} (${partialPercentage}%)`}
          icon={TrendingUp}
          variant="warning"
        />
        <StatCard
          title="Gap da Colmare"
          value={`${stats.notImplemented} (${gapPercentage}%)`}
          icon={AlertCircle}
          variant="danger"
        />
      </div>

      {/* Implementation Status Pie Chart */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Stato di Implementazione</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Conformity by Domain Chart */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Conformità per Dominio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {domainStats.map((domain) => (
            <div key={domain.name} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{domain.name}</span>
                <span className="text-muted-foreground">
                  {domain.implemented}/{domain.total} ({domain.percentage}%)
                </span>
              </div>
              <Progress value={domain.percentage} className="h-2" />
            </div>
          ))}
          
          <div className="pt-4 mt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-lg">CONFORMITÀ COMPLESSIVA</span>
              <span className="font-bold text-2xl gradient-primary bg-clip-text text-transparent">
                {overallCompliance}%
              </span>
            </div>
            <Progress value={overallCompliance} className="h-3 mt-2" />
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Reviews */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Prossime Revisioni
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="flex-1">
                <p className="font-medium">Revisione SoA</p>
                <p className="text-sm text-muted-foreground">Scadenza: {nextReviewDate} (tra 6 mesi)</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="flex-1">
                <p className="font-medium">Valutazione del Rischio</p>
                <p className="text-sm text-muted-foreground">Non ancora creata</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="flex-1">
                <p className="font-medium">Preparazione Audit</p>
                <p className="text-sm text-muted-foreground">Da programmare</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => navigate("/wizard")} size="lg" className="gap-2">
          🎯 Avvia Wizard Conformità
        </Button>
        <Button onClick={() => navigate("/soa")} variant="outline" size="lg" className="gap-2">
          <Download className="h-4 w-4" />
          Scarica SoA PDF
        </Button>
        <Button onClick={() => navigate("/controls")} variant="outline" size="lg" className="gap-2">
          <Plus className="h-4 w-4" />
          Gestisci Controlli
        </Button>
        <Button onClick={() => navigate("/settings")} variant="outline" size="lg" className="gap-2">
          <Settings className="h-4 w-4" />
          Impostazioni
        </Button>
      </div>
    </div>
  );
}
