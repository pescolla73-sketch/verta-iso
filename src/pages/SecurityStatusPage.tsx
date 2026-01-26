import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/StatCard";
import { AutoCombobox } from "@/components/ui/auto-combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Shield,
  AlertTriangle,
  Clock,
  Users,
  Server,
  Calendar,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  Building2,
  Briefcase,
} from "lucide-react";
import { format, addDays, isAfter, isBefore, parseISO } from "date-fns";
import { it } from "date-fns/locale";

const OBSOLETE_OS = ["Windows 7", "Windows XP", "Windows Vista", "Windows 8", "Windows Server 2008", "Windows Server 2003"];

export default function SecurityStatusPage() {
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");

  // Fetch organization
  const { data: organization } = useQuery<{ id: string; name: string } | null>({
    queryKey: ["organization"],
    queryFn: async () => {
      const { data } = await supabase
        .from("organization")
        .select("id, name")
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  // Fetch assets with security data
  const { data: assets = [], isLoading: assetsLoading } = useQuery<any[]>({
    queryKey: ["assets-security"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .order("criticality", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch tests with due dates
  const { data: tests = [], isLoading: testsLoading } = useQuery<any[]>({
    queryKey: ["asset-tests-security"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_tests")
        .select(`
          *,
          assets(name, criticality, department),
          roles(role_name)
        `)
        .eq("is_active", true)
        .order("next_due_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch training records
  const { data: trainings = [], isLoading: trainingsLoading } = useQuery<any[]>({
    queryKey: ["training-security"],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from("training_records")
        .select("*")
        .eq("organization_id", organization.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  // Fetch risks
  const { data: risks = [], isLoading: risksLoading } = useQuery<any[]>({
    queryKey: ["risks-security"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risks")
        .select("*, assets(name, department)")
        .order("inherent_risk_score", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch roles for filter
  const { data: rolesData = [] } = useQuery({
    queryKey: ["roles-filter", organization?.id],
    queryFn: async (): Promise<Array<{ id: string; role_name: string }>> => {
      if (!organization?.id) return [];
      // @ts-ignore - Deep type instantiation issue with Supabase client
      const result = await supabase.from("roles").select("id, role_name").eq("organization_id", organization.id);
      return (result.data || []) as Array<{ id: string; role_name: string }>;
    },
    enabled: !!organization?.id,
  });
  const roles = rolesData as Array<{ id: string; role_name: string }>;

  // Extract unique departments from assets
  const departments = useMemo(() => {
    const deptSet = new Set<string>();
    assets.forEach((asset) => {
      if (asset.department) deptSet.add(asset.department);
    });
    return Array.from(deptSet).sort();
  }, [assets]);

  // Apply filters
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      if (departmentFilter && asset.department !== departmentFilter) return false;
      return true;
    });
  }, [assets, departmentFilter]);

  const filteredTests = useMemo(() => {
    return tests.filter((test) => {
      if (departmentFilter && test.assets?.department !== departmentFilter) return false;
      if (roleFilter && test.responsible_role_id !== roleFilter) return false;
      return true;
    });
  }, [tests, departmentFilter, roleFilter]);

  const filteredRisks = useMemo(() => {
    return risks.filter((risk: any) => {
      if (departmentFilter && risk.assets?.department !== departmentFilter) return false;
      return true;
    });
  }, [risks, departmentFilter]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    // Critical assets
    const criticalAssets = filteredAssets.filter(
      (a) => a.criticality === "Critico" || a.criticality === "Alto"
    ).length;

    // Overdue tests
    const today = new Date();
    const overdueTests = filteredTests.filter((t) => {
      if (!t.next_due_date) return false;
      return isBefore(parseISO(t.next_due_date), today);
    }).length;

    // Staff needing training (no training in last 12 months)
    const oneYearAgo = addDays(today, -365);
    const trainedEmployees = new Set(
      trainings
        .filter((t) => isAfter(parseISO(t.training_date), oneYearAgo))
        .map((t) => t.employee_name.toLowerCase())
    );
    const allEmployees = new Set(trainings.map((t) => t.employee_name.toLowerCase()));
    const needsTraining = allEmployees.size - trainedEmployees.size;

    // Untreated risks (status = "Identificato")
    const untreatedRisks = filteredRisks.filter(
      (r) => r.status === "Identificato" && (r.inherent_risk_level === "Critico" || r.inherent_risk_level === "Alto")
    ).length;

    return { criticalAssets, overdueTests, needsTraining, untreatedRisks };
  }, [filteredAssets, filteredTests, trainings, filteredRisks]);

  // Security issues chart data
  const securityIssuesData = useMemo(() => {
    const obsoleteOS = filteredAssets.filter((a) => {
      if (!a.operating_system) return false;
      return OBSOLETE_OS.some((os) =>
        a.operating_system?.toLowerCase().includes(os.toLowerCase())
      );
    }).length;

    const noAntivirus = filteredAssets.filter((a) => !a.antivirus_installed).length;
    const noBackup = filteredAssets.filter((a) => !a.backup_enabled).length;
    const allOk = filteredAssets.length - Math.max(obsoleteOS, noAntivirus, noBackup);

    return [
      { name: "OS Obsoleto", value: obsoleteOS, color: "hsl(var(--destructive))" },
      { name: "Senza Antivirus", value: noAntivirus, color: "hsl(var(--warning))" },
      { name: "Senza Backup", value: noBackup, color: "hsl(350, 70%, 50%)" },
    ].filter((d) => d.value > 0);
  }, [filteredAssets]);

  // Asset criticality distribution
  const criticalityData = useMemo(() => {
    const counts = { Critico: 0, Alto: 0, Medio: 0, Basso: 0 };
    filteredAssets.forEach((a) => {
      if (a.criticality && counts.hasOwnProperty(a.criticality)) {
        counts[a.criticality as keyof typeof counts]++;
      }
    });
    return [
      { name: "Critico", value: counts.Critico, fill: "hsl(var(--destructive))" },
      { name: "Alto", value: counts.Alto, fill: "hsl(25, 95%, 53%)" },
      { name: "Medio", value: counts.Medio, fill: "hsl(45, 93%, 47%)" },
      { name: "Basso", value: counts.Basso, fill: "hsl(142, 71%, 45%)" },
    ];
  }, [filteredAssets]);

  // Upcoming tests (next 30 days)
  const upcomingTests = useMemo(() => {
    const today = new Date();
    const in30Days = addDays(today, 30);
    
    return filteredTests
      .filter((t) => {
        if (!t.next_due_date) return false;
        const dueDate = parseISO(t.next_due_date);
        return isAfter(dueDate, addDays(today, -7)) && isBefore(dueDate, in30Days);
      })
      .slice(0, 10);
  }, [filteredTests]);

  const clearFilters = () => {
    setDepartmentFilter("");
    setRoleFilter("");
  };

  const isLoading = assetsLoading || testsLoading || trainingsLoading || risksLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Situazione Sicurezza
          </h1>
          <p className="text-muted-foreground mt-1">
            Panoramica operativa della sicurezza IT aziendale
          </p>
        </div>
        <Badge variant="outline" className="text-sm w-fit">
          Aggiornato: {format(new Date(), "dd/MM/yyyy HH:mm", { locale: it })}
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtri Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">
                <Building2 className="h-4 w-4 inline mr-1" />
                Reparto
              </label>
              <AutoCombobox
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
                suggestions={departments}
                placeholder="Tutti i reparti"
                emptyText="Nessun reparto trovato"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">
                <Briefcase className="h-4 w-4 inline mr-1" />
                Mansione Responsabile
              </label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tutte le mansioni" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tutte le mansioni</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.role_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(departmentFilter || roleFilter) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <XCircle className="h-4 w-4 mr-1" />
                Resetta filtri
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Asset Critici"
          value={kpis.criticalAssets}
          icon={Server}
          variant={kpis.criticalAssets > 5 ? "danger" : "warning"}
          trend={
            kpis.criticalAssets > 0
              ? { value: `${kpis.criticalAssets} richiedono attenzione`, positive: false }
              : undefined
          }
        />
        <StatCard
          title="Test in Scadenza"
          value={kpis.overdueTests}
          icon={Clock}
          variant={kpis.overdueTests > 0 ? "danger" : "success"}
          trend={
            kpis.overdueTests > 0
              ? { value: "Verifiche urgenti necessarie", positive: false }
              : { value: "Tutti i test in regola", positive: true }
          }
        />
        <StatCard
          title="Personale da Formare"
          value={kpis.needsTraining}
          icon={Users}
          variant={kpis.needsTraining > 0 ? "warning" : "success"}
          trend={
            kpis.needsTraining > 0
              ? { value: "Training scaduto >12 mesi", positive: false }
              : { value: "Formazione aggiornata", positive: true }
          }
        />
        <StatCard
          title="Rischi non Trattati"
          value={kpis.untreatedRisks}
          icon={AlertTriangle}
          variant={kpis.untreatedRisks > 0 ? "danger" : "success"}
          trend={
            kpis.untreatedRisks > 0
              ? { value: "Rischi critici/alti aperti", positive: false }
              : { value: "Tutti i rischi gestiti", positive: true }
          }
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Issues Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Mappa delle Criticità
            </CardTitle>
            <CardDescription>
              Asset con configurazioni a rischio
            </CardDescription>
          </CardHeader>
          <CardContent>
            {securityIssuesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={securityIssuesData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]}>
                    {securityIssuesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[250px] text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
                <p className="text-lg font-medium text-green-600">Nessuna criticità rilevata!</p>
                <p className="text-sm text-muted-foreground">
                  Tutti gli asset hanno configurazioni sicure
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Asset Criticality Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Distribuzione Criticità Asset
            </CardTitle>
            <CardDescription>
              {filteredAssets.length} asset totali
              {departmentFilter && ` nel reparto ${departmentFilter}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={criticalityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => value > 0 ? `${name}: ${value}` : ""}
                >
                  {criticalityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activity Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendario Attività - Prossimi 30 giorni
          </CardTitle>
          <CardDescription>
            Test e verifiche programmate con scadenze imminenti
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingTests.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Scadenza</TableHead>
                    <TableHead>Test</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Criticità</TableHead>
                    <TableHead>Responsabile</TableHead>
                    <TableHead>Stato</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingTests.map((test) => {
                    const isOverdue = test.next_due_date && isBefore(parseISO(test.next_due_date), new Date());
                    return (
                      <TableRow key={test.id} className={isOverdue ? "bg-destructive/5" : ""}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {isOverdue && <AlertTriangle className="h-4 w-4 text-destructive" />}
                            <span className={isOverdue ? "text-destructive font-medium" : ""}>
                              {test.next_due_date
                                ? format(parseISO(test.next_due_date), "dd/MM/yyyy", { locale: it })
                                : "-"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{test.test_name}</TableCell>
                        <TableCell>{test.assets?.name || "-"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              test.assets?.criticality === "Critico"
                                ? "destructive"
                                : test.assets?.criticality === "Alto"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {test.assets?.criticality || "N/D"}
                          </Badge>
                        </TableCell>
                        <TableCell>{test.roles?.role_name || test.responsible_person || "-"}</TableCell>
                        <TableCell>
                          {isOverdue ? (
                            <Badge variant="destructive">In ritardo</Badge>
                          ) : (
                            <Badge variant="outline">Programmato</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
              <p className="text-lg font-medium">Nessuna verifica imminente</p>
              <p className="text-sm text-muted-foreground">
                Non ci sono test programmati nei prossimi 30 giorni
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Asset Totali</p>
                <p className="text-2xl font-bold">{filteredAssets.length}</p>
              </div>
              <Server className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Test Attivi</p>
                <p className="text-2xl font-bold">{filteredTests.length}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rischi Identificati</p>
                <p className="text-2xl font-bold">{filteredRisks.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
