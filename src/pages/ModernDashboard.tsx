import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Shield,
  AlertTriangle,
  Calendar,
  Award,
  FileText,
  Package,
  X,
  Clock,
  ChevronRight,
  Target,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface CertificationStep {
  id: number;
  title: string;
  description: string;
  path: string;
  completed: boolean;
  estimatedTime: string;
}

interface DashboardStats {
  controlsImplemented: number;
  totalControls: number;
  openNC: number;
  overdueNC: number;
  nextAuditDate: string | null;
  certificationStatus: string;
}

type DashboardAlertType = "error" | "warning" | "info";

interface DashboardAlert {
  id: string;
  type: DashboardAlertType;
  message: string;
  action: () => void;
}

export default function ModernDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  const [stats, setStats] = useState<DashboardStats>({
    controlsImplemented: 0,
    totalControls: 93,
    openNC: 0,
    overdueNC: 0,
    nextAuditDate: null,
    certificationStatus: "Non Certificato",
  });

  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);

  const certificationSteps: CertificationStep[] = [
    {
      id: 1,
      title: "Configurazione Organizzazione",
      description: "Definizione contesto e ambito ISMS",
      path: "/setup-azienda",
      completed: true,
      estimatedTime: "15 min",
    },
    {
      id: 2,
      title: "Policy di Sicurezza",
      description: "Documentazione politiche ISMS",
      path: "/policies",
      completed: true,
      estimatedTime: "30 min",
    },
    {
      id: 3,
      title: "Analisi dei Rischi",
      description: "Valutazione e trattamento rischi",
      path: "/risk-assessment",
      completed: false,
      estimatedTime: "30 min",
    },
    {
      id: 4,
      title: "Implementazione Controlli",
      description: "Attuazione misure di sicurezza",
      path: "/controls",
      completed: false,
      estimatedTime: "2 ore",
    },
    {
      id: 5,
      title: "Statement of Applicability",
      description: "Dichiarazione di applicabilità",
      path: "/soa",
      completed: false,
      estimatedTime: "45 min",
    },
    {
      id: 6,
      title: "Audit Interno",
      description: "Verifica conformità interna",
      path: "/audit-interni",
      completed: false,
      estimatedTime: "1 ora",
    },
    {
      id: 7,
      title: "Audit di Certificazione",
      description: "Verifica ente certificatore",
      path: "/certification-audit",
      completed: false,
      estimatedTime: "1 giorno",
    },
  ];

  useEffect(() => {
    document.title = "Dashboard ISMS - ISO 27001";
  }, []);

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: org } = await supabase
        .from("organization")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (!org) {
        setLoading(false);
        return;
      }

      const { data: controls } = await supabase
        .from("controls")
        .select("status");

      const implemented =
        controls?.filter((c) => c.status === "implemented").length || 0;
      const totalControls = controls?.length ?? 93;

      const { data: ncs } = await supabase
        .from("non_conformities")
        .select("status, deadline")
        .eq("organization_id", org.id)
        .in("status", ["open", "in_progress"]);

      const overdue =
        ncs?.filter((nc) => {
          if (!nc.deadline) return false;
          return new Date(nc.deadline) < new Date();
        }).length || 0;

      const { data: nextAudit } = await supabase
        .from("certification_audits")
        .select("audit_date")
        .eq("organization_id", org.id)
        .gte("audit_date", new Date().toISOString())
        .order("audit_date", { ascending: true })
        .limit(1)
        .maybeSingle();

      const { data: lastCert } = await supabase
        .from("certification_audits")
        .select("certificate_expiry_date")
        .eq("organization_id", org.id)
        .not("certificate_expiry_date", "is", null)
        .order("certificate_expiry_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      let certificationStatus = "Non Certificato";
      if (lastCert?.certificate_expiry_date) {
        const expiry = new Date(lastCert.certificate_expiry_date);
        const now = new Date();
        certificationStatus = expiry > now ? "Certificato" : "Certificato scaduto";
      }

      setStats({
        controlsImplemented: implemented,
        totalControls,
        openNC: ncs?.length || 0,
        overdueNC: overdue,
        nextAuditDate: nextAudit?.audit_date ?? null,
        certificationStatus,
      });

      const dashboardAlerts: DashboardAlert[] = [];
      if (overdue > 0) {
        dashboardAlerts.push({
          id: "overdue-nc",
          type: "error",
          message: `${overdue} non-conformità scadute richiedono attenzione`,
          action: () => navigate("/non-conformity?filter=overdue"),
        });
      }
      if (ncs && ncs.length > 0) {
        dashboardAlerts.push({
          id: "open-nc",
          type: "warning",
          message: `${ncs.length} non-conformità aperte`,
          action: () => navigate("/non-conformity"),
        });
      }
      if (nextAudit?.audit_date) {
        const daysUntil = Math.floor(
          (new Date(nextAudit.audit_date).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        );
        dashboardAlerts.push({
          id: "next-audit",
          type: "info",
          message: `Prossimo audit tra ${daysUntil} giorni`,
          action: () => navigate("/certification-audit"),
        });
      }

      setAlerts(dashboardAlerts.filter((a) => !dismissedAlerts.includes(a.id)));
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts((prev) => [...prev, alertId]);
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  const nextStep = certificationSteps.find((s) => !s.completed);
  const completedSteps = certificationSteps.filter((s) => s.completed).length;
  const completionPercentage = Math.round(
    (completedSteps / certificationSteps.length) * 100
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-card border-b border-border p-6 -mx-6 -mt-6 mb-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Sistema di Gestione Sicurezza Informazioni
              </h1>
              <p className="text-muted-foreground mt-1">
                Panoramica conformità ISO 27001:2022 — {format(new Date(), 'dd MMMM yyyy', { locale: it })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge 
                variant={stats.certificationStatus === 'Certificato' ? 'default' : 'secondary'}
                className="text-sm"
              >
                {stats.certificationStatus}
              </Badge>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <Alert
                key={alert.id}
                variant={alert.type === "error" ? "destructive" : "default"}
                className="cursor-pointer hover:bg-muted/50 transition-colors relative pr-10"
                onClick={alert.action}
              >
                {alert.type === "error" && <AlertTriangle className="h-4 w-4" />}
                {alert.type === "warning" && <AlertCircle className="h-4 w-4" />}
                {alert.type === "info" && <Calendar className="h-4 w-4" />}
                <AlertDescription className="font-medium">
                  {alert.message}
                </AlertDescription>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissAlert(alert.id);
                  }}
                  className="absolute right-2 top-2 opacity-70 hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </Alert>
            ))}
          </div>
        )}

        {/* Certification Progress */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">
                  Stato Implementazione ISMS
                </CardTitle>
                <CardDescription>
                  Avanzamento verso la certificazione ISO 27001:2022
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-primary">
                  {completionPercentage}%
                </div>
                <p className="text-sm text-muted-foreground">
                  {completedSteps}/{certificationSteps.length} fasi completate
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Progress value={completionPercentage} className="h-2" />
            
            {/* Steps indicator */}
            <div className="flex items-center justify-between">
              {certificationSteps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`
                      flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium
                      ${step.completed
                        ? "bg-green-600 border-green-600 text-white"
                        : index === completedSteps
                          ? "bg-primary border-primary text-primary-foreground"
                          : "bg-muted border-border text-muted-foreground"
                      }
                    `}
                  >
                    {step.completed ? <CheckCircle className="h-4 w-4" /> : step.id}
                  </div>
                  {index < certificationSteps.length - 1 && (
                    <div
                      className={`w-8 md:w-12 h-0.5 mx-1 ${
                        step.completed ? "bg-green-600" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Next Action */}
            {nextStep && (
              <div className="bg-muted/50 rounded-lg p-4 border">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary rounded-lg">
                    <ArrowRight className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Prossima Azione
                    </p>
                    <h3 className="text-lg font-semibold mt-1">{nextStep.title}</h3>
                    <p className="text-muted-foreground text-sm">{nextStep.description}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <Button onClick={() => navigate(nextStep.path)}>
                        Procedi
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {nextStep.estimatedTime}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card
            className="border-l-4 border-l-primary cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate("/controls")}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Shield className="h-5 w-5 text-primary" />
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.controlsImplemented}/{stats.totalControls}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Controlli implementati</p>
              <Progress
                value={(stats.controlsImplemented / stats.totalControls) * 100}
                className="mt-2 h-1"
              />
            </CardContent>
          </Card>

          <Card
            className={`border-l-4 cursor-pointer hover:shadow-md transition-shadow ${
              stats.overdueNC > 0
                ? "border-l-destructive"
                : "border-l-yellow-500"
            }`}
            onClick={() => navigate("/non-conformity")}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <AlertTriangle className={`h-5 w-5 ${stats.overdueNC > 0 ? "text-destructive" : "text-yellow-600"}`} />
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.openNC}</div>
              <p className="text-sm text-muted-foreground mt-1">Non-conformità aperte</p>
              {stats.overdueNC > 0 && (
                <p className="text-xs text-destructive font-medium mt-1">
                  {stats.overdueNC} scadute
                </p>
              )}
            </CardContent>
          </Card>

          <Card
            className="border-l-4 border-l-blue-500 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate("/certification-audit")}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Calendar className="h-5 w-5 text-blue-600" />
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {stats.nextAuditDate
                  ? format(new Date(stats.nextAuditDate), 'dd MMM yyyy', { locale: it })
                  : "Da pianificare"}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Prossimo audit</p>
            </CardContent>
          </Card>

          <Card
            className="border-l-4 border-l-green-600 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate("/certification-audit")}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Award className="h-5 w-5 text-green-600" />
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {stats.certificationStatus === "Certificato" ? "Attivo" : "In corso"}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Stato certificazione</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Azioni Rapide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="h-auto py-4 justify-start"
                onClick={() => navigate("/policy-editor")}
              >
                <FileText className="h-5 w-5 mr-3 text-primary" />
                <div className="text-left">
                  <div className="font-semibold">Nuova Policy</div>
                  <div className="text-xs text-muted-foreground">Crea una policy di sicurezza</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 justify-start"
                onClick={() => navigate("/risk-assessment")}
              >
                <AlertCircle className="h-5 w-5 mr-3 text-orange-600" />
                <div className="text-left">
                  <div className="font-semibold">Valuta Rischio</div>
                  <div className="text-xs text-muted-foreground">Aggiungi analisi rischi</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 justify-start"
                onClick={() => navigate("/assets")}
              >
                <Package className="h-5 w-5 mr-3 text-green-600" />
                <div className="text-left">
                  <div className="font-semibold">Registra Asset</div>
                  <div className="text-xs text-muted-foreground">Cataloga risorse aziendali</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
