import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  AlertTriangle,
  Calendar,
  Award,
  FileText,
  Package,
  X,
  Clock,
  Zap,
  Sparkles,
  Rocket,
  Target,
} from "lucide-react";

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
  icon: string;
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
      title: "Parlaci di te",
      description: "Definisci chi sei e cosa fai",
      path: "/setup-azienda",
      completed: true,
      estimatedTime: "15 min",
    },
    {
      id: 2,
      title: "Le tue regole",
      description: "Crea le policy di sicurezza",
      path: "/policies",
      completed: true,
      estimatedTime: "30 min",
    },
    {
      id: 3,
      title: "Identifica i rischi",
      description: "Cosa potrebbe andare storto?",
      path: "/risk-assessment",
      completed: false,
      estimatedTime: "30 min",
    },
    {
      id: 4,
      title: "Attiva protezioni",
      description: "Implementa i controlli di sicurezza",
      path: "/controls",
      completed: false,
      estimatedTime: "2 ore",
    },
    {
      id: 5,
      title: "Documenta tutto",
      description: "Compila il registro protezioni (SoA)",
      path: "/soa",
      completed: false,
      estimatedTime: "45 min",
    },
    {
      id: 6,
      title: "Verifica internamente",
      description: "Fai un controllo prima dell'auditor",
      path: "/audit-interni",
      completed: false,
      estimatedTime: "1 ora",
    },
    {
      id: 7,
      title: "Ottieni certificato",
      description: "Audit finale e certificazione!",
      path: "/certification-audit",
      completed: false,
      estimatedTime: "1 giorno",
    },
  ];

  useEffect(() => {
    document.title = "Dashboard moderna ISO 27001";
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
          icon: "🔴",
          message: `${overdue} NC scadute`,
          action: () => navigate("/non-conformity?filter=overdue"),
        });
      }
      if (ncs && ncs.length > 0) {
        dashboardAlerts.push({
          id: "open-nc",
          type: "warning",
          icon: "🟡",
          message: `${ncs.length} NC aperte`,
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
          icon: "📅",
          message: `Audit tra ${daysUntil} giorni`,
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
    return <div className="flex items-center justify-center p-8">Caricamento...</div>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              👋 Ciao{user ? `, ${user.email?.split("@")[0]}` : ""}! Bentornato
            </h1>
            <p className="text-muted-foreground mt-1">
              Il tuo viaggio verso la certificazione ISO 27001
            </p>
          </div>
          <div className="flex items-center gap-4">
            {alerts.length > 0 && (
              <Badge variant="destructive" className="h-8 px-3">
                🔔 {alerts.length} Alert
              </Badge>
            )}
          </div>
        </div>

        {alerts.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {alerts.map((alert) => (
              <Alert
                key={alert.id}
                variant={alert.type === "error" ? "destructive" : "default"}
                className="flex-shrink-0 cursor-pointer hover:shadow-md transition-shadow relative pr-10"
                onClick={alert.action}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissAlert(alert.id);
                  }}
                  className="absolute right-2 top-2 opacity-70 hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
                <AlertDescription className="font-medium">
                  {alert.icon} {alert.message}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        <Card className="border-2 border-indigo-200 bg-gradient-to-br from-white to-indigo-50 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  🎯 IL TUO VIAGGIO VERSO LA CERTIFICAZIONE
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Segui questi passi per ottenere la certificazione
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {completionPercentage}%
                </div>
                <Badge variant="outline" className="mt-1">
                  🏆 {stats.certificationStatus}
                </Badge>
              </div>
            </div>
            <div className="mt-4">
              <Progress value={completionPercentage} className="h-3" />
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              {certificationSteps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold
                    ${step.completed
                      ? "bg-green-500 border-green-500 text-white"
                      : index === completedSteps
                        ? "bg-yellow-400 border-yellow-400 text-white animate-pulse"
                        : "bg-gray-200 border-gray-300 text-gray-500"
                    }
                  `}
                  >
                    {step.completed ? "✓" : step.id}
                  </div>
                  {index < certificationSteps.length - 1 && (
                    <div
                      className={`w-12 h-1 mx-1 ${
                        step.completed ? "bg-green-500" : "bg-gray-300"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {nextStep && (
              <div className="mt-6 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-300">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-yellow-400 rounded-full">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1">👉 PROSSIMO: {nextStep.title}</h3>
                    <p className="text-muted-foreground mb-4">{nextStep.description}</p>
                    <div className="flex items-center gap-4">
                      <Button
                        size="lg"
                        onClick={() => navigate(nextStep.path)}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                      >
                        <Rocket className="h-5 w-5 mr-2" />
                        Inizia Ora
                      </Button>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        ~{nextStep.estimatedTime}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card
            className="border-2 border-indigo-200 hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-white to-indigo-50"
            onClick={() => navigate("/controls")}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Shield className="h-8 w-8 text-indigo-600" />
                <Sparkles className="h-5 w-5 text-indigo-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-600">
                {stats.controlsImplemented}/{stats.totalControls}
              </div>
              <p className="text-sm text-muted-foreground mt-1">🛡️ Protezioni attive</p>
              <div className="flex items-center gap-2 mt-2">
                <Progress
                  value={(stats.controlsImplemented / stats.totalControls) * 100}
                  className="flex-1"
                />
                <span className="text-xs font-medium text-green-600">
                  ⬆️ {Math.round((stats.controlsImplemented / stats.totalControls) * 100)}%
                </span>
              </div>
              <Button variant="link" size="sm" className="mt-2 p-0 h-auto text-indigo-600 hover:text-indigo-700 hover:underline">
                Vedi tutti →
              </Button>
            </CardContent>
          </Card>

          <Card
            className={`border-2 hover:shadow-lg transition-shadow cursor-pointer ${
              stats.overdueNC > 0
                ? "border-red-300 bg-gradient-to-br from-white to-red-50"
                : "border-orange-200 bg-gradient-to-br from-white to-orange-50"
            }`}
            onClick={() => navigate("/non-conformity")}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
                {stats.overdueNC > 0 && (
                  <Badge variant="destructive">{stats.overdueNC} rosse</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{stats.openNC}</div>
              <p className="text-sm text-muted-foreground mt-1">⚠️ Cose da sistemare</p>
              {stats.overdueNC > 0 && (
                <p className="text-xs text-red-600 font-medium mt-1">
                  {stats.overdueNC} scadute
                </p>
              )}
              <Button variant="link" size="sm" className="mt-2 p-0 h-auto text-orange-600 hover:text-orange-700 hover:underline">
                Gestisci →
              </Button>
            </CardContent>
          </Card>

          <Card
            className="border-2 border-blue-200 hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-white to-blue-50"
            onClick={() => navigate("/certification-audit")}
          >
            <CardHeader className="pb-2">
              <Calendar className="h-8 w-8 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-blue-600">
                {stats.nextAuditDate
                  ? new Date(stats.nextAuditDate).toLocaleDateString("it-IT", {
                      day: "numeric",
                      month: "short",
                    })
                  : "Da pianificare"}
              </div>
              <p className="text-sm text-muted-foreground mt-1">📅 Prossima verifica</p>
              <Button variant="link" size="sm" className="mt-2 p-0 h-auto text-blue-600 hover:text-blue-700 hover:underline">
                Prepara →
              </Button>
            </CardContent>
          </Card>

          <Card
            className="border-2 border-purple-200 hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-white to-purple-50"
            onClick={() => navigate("/certification-audit")}
          >
            <CardHeader className="pb-2">
              <Award className="h-8 w-8 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-purple-600">
                {stats.certificationStatus === "Certificato" ? "Certificato!" : "In corso"}
              </div>
              <p className="text-sm text-muted-foreground mt-1">🎯 Il tuo obiettivo</p>
              <p className="text-xs text-muted-foreground mt-1">Ottieni la certificazione</p>
              <Button variant="link" size="sm" className="mt-2 p-0 h-auto text-purple-600 hover:text-purple-700 hover:underline">
                Piano →
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              🚀 Cosa vuoi fare?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="h-auto py-4 justify-start hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-900"
                onClick={() => navigate("/policy-editor")}
              >
                <FileText className="h-5 w-5 mr-3 text-indigo-600" />
                <div className="text-left">
                  <div className="font-semibold">📝 Crea una Regola</div>
                  <div className="text-xs text-muted-foreground">Aggiungi una policy di sicurezza</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 justify-start hover:bg-orange-50 hover:border-orange-300 hover:text-orange-900"
                onClick={() => navigate("/risk-assessment")}
              >
                <Target className="h-5 w-5 mr-3 text-orange-600" />
                <div className="text-left">
                  <div className="font-semibold">🎯 Identifica un Rischio</div>
                  <div className="text-xs text-muted-foreground">Cosa potrebbe andare male?</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 justify-start hover:bg-green-50 hover:border-green-300 hover:text-green-900"
                onClick={() => navigate("/assets")}
              >
                <Package className="h-5 w-5 mr-3 text-green-600" />
                <div className="text-left">
                  <div className="font-semibold">💻 Registra una Risorsa</div>
                  <div className="text-xs text-muted-foreground">Computer, server, dati importanti</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
