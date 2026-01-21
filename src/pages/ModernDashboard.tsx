import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  AlertTriangle,
  Calendar,
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
  const [organizationName, setOrganizationName] = useState("Organizzazione");

  const [stats, setStats] = useState<DashboardStats>({
    controlsImplemented: 0,
    totalControls: 93,
    openNC: 0,
    overdueNC: 0,
    nextAuditDate: null,
    certificationStatus: "non_certified",
  });

  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);

  // PDCA Phase progress (simplified calculation)
  const [phaseProgress, setPhaseProgress] = useState({
    plan: 0,
    do: 0,
    check: 0,
    act: 0,
  });

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
        .select("id, name")
        .limit(1)
        .maybeSingle();

      if (!org) {
        setLoading(false);
        return;
      }

      setOrganizationName(org.name || "Organizzazione");

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

      let certificationStatus = "non_certified";
      if (lastCert?.certificate_expiry_date) {
        const expiry = new Date(lastCert.certificate_expiry_date);
        const now = new Date();
        certificationStatus = expiry > now ? "certified" : "expired";
      }

      // Fetch overdue/failed tests
      const { data: overdueTests } = await supabase
        .from("asset_tests")
        .select("id, test_name, next_due_date")
        .eq("is_active", true)
        .lt("next_due_date", new Date().toISOString().split("T")[0]);

      const { data: failedTests } = await supabase
        .from("asset_test_executions")
        .select("id, test_id")
        .eq("result", "failed")
        .gte("execution_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);

      // Calculate PDCA phases based on controls
      const controlProgress = (implemented / totalControls) * 100;
      setPhaseProgress({
        plan: Math.min(100, controlProgress + 30), // Setup and planning ahead
        do: controlProgress,
        check: Math.min(100, controlProgress * 0.7),
        act: Math.min(100, controlProgress * 0.5),
      });

      setStats({
        controlsImplemented: implemented,
        totalControls,
        openNC: ncs?.length || 0,
        overdueNC: overdue,
        nextAuditDate: nextAudit?.audit_date ?? null,
        certificationStatus,
      });

      const dashboardAlerts: DashboardAlert[] = [];
      
      // Test alerts
      if (overdueTests && overdueTests.length > 0) {
        dashboardAlerts.push({
          id: "overdue-tests",
          type: "error",
          message: `${overdueTests.length} test periodici scaduti richiedono attenzione`,
          action: () => navigate("/test-verifiche?filter=overdue"),
        });
      }
      
      if (failedTests && failedTests.length > 0) {
        dashboardAlerts.push({
          id: "failed-tests",
          type: "warning",
          message: `${failedTests.length} test falliti negli ultimi 30 giorni`,
          action: () => navigate("/test-verifiche"),
        });
      }
      
      if (overdue > 0) {
        dashboardAlerts.push({
          id: "overdue-nc",
          type: "error",
          message: `${overdue} non-conformità scadute richiedono attenzione`,
          action: () => navigate("/non-conformity?filter=overdue"),
        });
      }
      if (ncs && ncs.length > 0 && overdue === 0) {
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
        if (daysUntil <= 30) {
          dashboardAlerts.push({
            id: "next-audit",
            type: "info",
            message: `Prossimo audit tra ${daysUntil} giorni`,
            action: () => navigate("/certification-audit"),
          });
        }
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
  const overallProgress = Math.round(
    (completedSteps / certificationSteps.length) * 100
  );

  // Calculate days until next audit
  const nextAuditDays = stats.nextAuditDate
    ? Math.floor(
        (new Date(stats.nextAuditDate).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-prof-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--prof-primary))]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-prof-bg">
      {/* Header Professional */}
      <div className="bg-prof-surface border-b border-prof-border">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="heading-prof heading-prof-xl">
                Sistema di Gestione Sicurezza Informazioni
              </h1>
              <p className="text-prof-muted mt-1">
                Panoramica conformità ISO 27001:2022 - {format(new Date(), "dd MMMM yyyy", { locale: it })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="badge-prof badge-prof-neutral">
                {organizationName}
              </span>
              <span className={stats.certificationStatus === "certified" ? "badge-prof badge-prof-success" : "badge-prof badge-prof-neutral"}>
                {stats.certificationStatus === "certified" ? "Certificato" : "In implementazione"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="px-6 pt-4 space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`alert-prof ${
                alert.type === "error" ? "alert-prof-error" :
                alert.type === "warning" ? "alert-prof-warning" : "alert-prof-info"
              } cursor-pointer relative`}
              onClick={alert.action}
            >
              {alert.type === "error" && <AlertTriangle className="h-5 w-5 flex-shrink-0" />}
              {alert.type === "warning" && <AlertCircle className="h-5 w-5 flex-shrink-0" />}
              {alert.type === "info" && <Calendar className="h-5 w-5 flex-shrink-0" />}
              <div className="flex-1">
                <span className="font-medium">{alert.message}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dismissAlert(alert.id);
                }}
                className="opacity-70 hover:opacity-100 ml-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Controlli */}
          <div 
            className="stat-card-prof cursor-pointer"
            onClick={() => navigate("/controls")}
          >
            <div className="flex items-center justify-between">
              <div className="stat-card-label-prof">Controlli Implementati</div>
              <Shield className="h-5 w-5 text-prof-primary" />
            </div>
            <div className="stat-card-value-prof">{stats.controlsImplemented}</div>
            <div className="stat-card-desc-prof">
              su {stats.totalControls} controlli ISO 27001
            </div>
            <div className="progress-prof mt-3">
              <div
                className="progress-bar-prof"
                style={{ width: `${(stats.controlsImplemented / stats.totalControls) * 100}%` }}
              />
            </div>
          </div>

          {/* Non-Conformità */}
          <div 
            className="stat-card-prof cursor-pointer"
            onClick={() => navigate("/non-conformity")}
          >
            <div className="flex items-center justify-between">
              <div className="stat-card-label-prof">Non-Conformità Aperte</div>
              <AlertCircle className={`h-5 w-5 ${stats.overdueNC > 0 ? "text-prof-error" : "text-prof-warning"}`} />
            </div>
            <div className="stat-card-value-prof">{stats.openNC}</div>
            <div className="stat-card-desc-prof">
              {stats.overdueNC > 0 ? `${stats.overdueNC} scadute` : "Nessuna scaduta"}
            </div>
          </div>

          {/* Prossimo Audit */}
          <div 
            className="stat-card-prof cursor-pointer"
            onClick={() => navigate("/certification-audit")}
          >
            <div className="flex items-center justify-between">
              <div className="stat-card-label-prof">Prossimo Audit</div>
              <Calendar className="h-5 w-5 text-prof-info" />
            </div>
            <div className="stat-card-value-prof text-2xl">
              {nextAuditDays > 0 ? `${nextAuditDays}gg` : "N/D"}
            </div>
            <div className="stat-card-desc-prof">
              {nextAuditDays > 0 ? "giorni rimanenti" : "Non pianificato"}
            </div>
          </div>

          {/* Certificazione */}
          <div 
            className="stat-card-prof cursor-pointer"
            onClick={() => navigate("/certification-audit")}
          >
            <div className="flex items-center justify-between">
              <div className="stat-card-label-prof">Stato Certificazione</div>
              <CheckCircle className={`h-5 w-5 ${stats.certificationStatus === "certified" ? "text-prof-success" : "text-prof-secondary"}`} />
            </div>
            <div className="stat-card-value-prof text-2xl">
              {stats.certificationStatus === "certified" ? "Attivo" : `${overallProgress}%`}
            </div>
            <div className="stat-card-desc-prof">
              {stats.certificationStatus === "certified" ? "Certificato ISO 27001" : "Avanzamento"}
            </div>
          </div>
        </div>

        {/* Stato Implementazione ISMS */}
        <Card className="card-prof !p-0 overflow-hidden">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="heading-prof heading-prof-lg">
              Stato Implementazione ISMS
            </CardTitle>
            <CardDescription className="text-prof-muted">
              Avanzamento verso la certificazione ISO 27001:2022
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-6">
            {/* Progress Complessivo */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-prof-secondary">
                  Completamento Complessivo
                </span>
                <span className="text-3xl font-bold text-prof-primary">
                  {overallProgress}%
                </span>
              </div>
              <div className="progress-prof">
                <div
                  className="progress-bar-prof"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>

            {/* Fasi PDCA */}
            <div className="grid grid-cols-4 gap-4">
              <div className="phase-indicator-prof phase-indicator-plan">
                <div className="text-xs font-semibold text-prof-muted uppercase">
                  Plan
                </div>
                <div className="text-2xl font-bold mt-1" style={{ color: "hsl(var(--prof-text))" }}>
                  {Math.round(phaseProgress.plan)}%
                </div>
                <div className="text-xs text-prof-muted mt-1">
                  Setup, Risk, Asset
                </div>
              </div>

              <div className="phase-indicator-prof phase-indicator-do">
                <div className="text-xs font-semibold text-prof-muted uppercase">
                  Do
                </div>
                <div className="text-2xl font-bold mt-1" style={{ color: "hsl(var(--prof-text))" }}>
                  {Math.round(phaseProgress.do)}%
                </div>
                <div className="text-xs text-prof-muted mt-1">
                  Policy, Controlli
                </div>
              </div>

              <div className="phase-indicator-prof phase-indicator-check">
                <div className="text-xs font-semibold text-prof-muted uppercase">
                  Check
                </div>
                <div className="text-2xl font-bold mt-1" style={{ color: "hsl(var(--prof-text))" }}>
                  {Math.round(phaseProgress.check)}%
                </div>
                <div className="text-xs text-prof-muted mt-1">
                  Audit, Monitoring
                </div>
              </div>

              <div className="phase-indicator-prof phase-indicator-act">
                <div className="text-xs font-semibold text-prof-muted uppercase">
                  Act
                </div>
                <div className="text-2xl font-bold mt-1" style={{ color: "hsl(var(--prof-text))" }}>
                  {Math.round(phaseProgress.act)}%
                </div>
                <div className="text-xs text-prof-muted mt-1">
                  Review, Improve
                </div>
              </div>
            </div>

            {/* Prossima Azione */}
            {nextStep && (
              <div className="alert-prof alert-prof-info">
                <ArrowRight className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-sm uppercase tracking-wide">
                    Prossima Azione Richiesta
                  </div>
                  <div className="font-medium mt-1" style={{ color: "hsl(var(--prof-text))" }}>
                    {nextStep.title}
                  </div>
                  <div className="text-sm mt-1 opacity-80">
                    {nextStep.description}
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <Button
                      size="sm"
                      className="btn-prof-primary"
                      onClick={() => navigate(nextStep.path)}
                    >
                      Procedi
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                    <div className="flex items-center gap-2 text-sm opacity-80">
                      <Clock className="h-4 w-4" />
                      {nextStep.estimatedTime}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className="quick-action-card-prof"
            onClick={() => navigate("/policy-editor")}
          >
            <FileText className="h-8 w-8 text-prof-primary mb-3" />
            <h3 className="heading-prof heading-prof-sm mb-1">Nuova Policy</h3>
            <p className="text-prof-muted text-sm">
              Crea una policy di sicurezza
            </p>
          </div>

          <div
            className="quick-action-card-prof"
            onClick={() => navigate("/risk-assessment")}
          >
            <Target className="h-8 w-8 text-prof-primary mb-3" />
            <h3 className="heading-prof heading-prof-sm mb-1">Identifica Rischio</h3>
            <p className="text-prof-muted text-sm">
              Valuta un nuovo rischio
            </p>
          </div>

          <div
            className="quick-action-card-prof"
            onClick={() => navigate("/assets")}
          >
            <Package className="h-8 w-8 text-prof-primary mb-3" />
            <h3 className="heading-prof heading-prof-sm mb-1">Registra Asset</h3>
            <p className="text-prof-muted text-sm">
              Hardware, software, dati
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
