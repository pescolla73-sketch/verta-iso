import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, isPast, differenceInDays } from "date-fns";
import { it } from "date-fns/locale";
import { AlertTriangle, Clock, FileWarning, CheckCircle, Filter, Calendar, ShieldAlert } from "lucide-react";

interface TestSchedulerDashboardProps {
  onExecuteTest?: (test: any) => void;
}

export function TestSchedulerDashboard({ onExecuteTest }: TestSchedulerDashboardProps) {
  const [criticalityFilter, setCriticalityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch tests with asset info including criticality
  const { data: tests = [], isLoading } = useQuery({
    queryKey: ["scheduler-tests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_tests")
        .select(`
          *,
          assets (id, name, asset_id, asset_type, criticality, backup_enabled, antivirus_installed),
          roles:responsible_role_id (id, role_name)
        `)
        .eq("is_active", true)
        .order("next_due_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch executions to identify tests without evidence
  const { data: executions = [] } = useQuery({
    queryKey: ["scheduler-executions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_test_executions")
        .select("test_id, evidence_files, execution_date, result")
        .order("execution_date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Calculate tests missing evidence (passed without evidence)
  const testsMissingEvidence = tests.filter((test: any) => {
    const lastExecution = executions.find((e: any) => e.test_id === test.id);
    if (!lastExecution) return false;
    const hasEvidence = lastExecution.evidence_files && 
      Array.isArray(lastExecution.evidence_files) && 
      lastExecution.evidence_files.length > 0;
    return !hasEvidence && lastExecution.result === "passed";
  });

  // Filter logic
  const filteredTests = tests.filter((test: any) => {
    // Criticality filter
    if (criticalityFilter !== "all") {
      const assetCriticality = test.assets?.criticality?.toLowerCase();
      if (criticalityFilter === "critical" && assetCriticality !== "critical" && assetCriticality !== "critico") return false;
      if (criticalityFilter === "high" && assetCriticality !== "high" && assetCriticality !== "alto") return false;
      if (criticalityFilter === "medium" && assetCriticality !== "medium" && assetCriticality !== "medio") return false;
    }

    // Status filter
    if (statusFilter === "overdue") {
      return test.next_due_date && isPast(new Date(test.next_due_date));
    }
    if (statusFilter === "upcoming") {
      if (!test.next_due_date) return false;
      const days = differenceInDays(new Date(test.next_due_date), new Date());
      return days >= 0 && days <= 7;
    }
    if (statusFilter === "missing_evidence") {
      const lastExecution = executions.find((e: any) => e.test_id === test.id);
      if (!lastExecution) return false;
      const hasEvidence = lastExecution.evidence_files && 
        Array.isArray(lastExecution.evidence_files) && 
        lastExecution.evidence_files.length > 0;
      return !hasEvidence;
    }

    return true;
  });

  // Stats
  const overdueTests = tests.filter((t: any) => t.next_due_date && isPast(new Date(t.next_due_date)));
  const criticalOverdue = overdueTests.filter((t: any) => 
    t.assets?.criticality?.toLowerCase() === "critical" || t.assets?.criticality?.toLowerCase() === "critico"
  );

  const getStatusBadge = (test: any) => {
    if (!test.next_due_date) {
      return <Badge variant="secondary">Da pianificare</Badge>;
    }
    const dueDate = new Date(test.next_due_date);
    const daysUntilDue = differenceInDays(dueDate, new Date());
    
    if (isPast(dueDate)) {
      const daysOverdue = Math.abs(daysUntilDue);
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Scaduto da {daysOverdue}gg
        </Badge>
      );
    }
    if (daysUntilDue <= 7) {
      return (
        <Badge variant="outline" className="border-yellow-500 text-yellow-600 gap-1">
          <Clock className="h-3 w-3" />
          Tra {daysUntilDue}gg
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <Calendar className="h-3 w-3" />
        {format(dueDate, "dd/MM/yyyy")}
      </Badge>
    );
  };

  const getCriticalityBadge = (criticality: string) => {
    const value = criticality?.toLowerCase();
    if (value === "critical" || value === "critico") {
      return <Badge className="bg-red-500">Critico</Badge>;
    }
    if (value === "high" || value === "alto") {
      return <Badge className="bg-orange-500">Alto</Badge>;
    }
    if (value === "medium" || value === "medio") {
      return <Badge className="bg-yellow-500">Medio</Badge>;
    }
    return <Badge variant="secondary">Basso</Badge>;
  };

  const hasEvidenceForTest = (testId: string) => {
    const lastExecution = executions.find((e: any) => e.test_id === testId);
    if (!lastExecution) return null; // Never executed
    return lastExecution.evidence_files && 
      Array.isArray(lastExecution.evidence_files) && 
      lastExecution.evidence_files.length > 0;
  };

  return (
    <div className="space-y-6">
      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={overdueTests.length > 0 ? "border-destructive" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 ${overdueTests.length > 0 ? "text-destructive" : ""}`} />
              Test Scaduti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overdueTests.length > 0 ? "text-destructive" : ""}`}>
              {overdueTests.length}
            </div>
          </CardContent>
        </Card>

        <Card className={criticalOverdue.length > 0 ? "border-red-600 bg-red-50 dark:bg-red-950/20" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShieldAlert className={`h-4 w-4 ${criticalOverdue.length > 0 ? "text-red-600" : ""}`} />
              Critici Scaduti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${criticalOverdue.length > 0 ? "text-red-600" : ""}`}>
              {criticalOverdue.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              In Scadenza (7gg)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {tests.filter((t: any) => {
                if (!t.next_due_date) return false;
                const days = differenceInDays(new Date(t.next_due_date), new Date());
                return days >= 0 && days <= 7;
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card className={testsMissingEvidence.length > 0 ? "border-orange-500" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileWarning className={`h-4 w-4 ${testsMissingEvidence.length > 0 ? "text-orange-500" : ""}`} />
              Senza Evidenze
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${testsMissingEvidence.length > 0 ? "text-orange-500" : ""}`}>
              {testsMissingEvidence.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Scadenziario Test
          </CardTitle>
          <CardDescription>
            Monitora i test in base alla criticità degli asset e allo stato di esecuzione
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Select value={criticalityFilter} onValueChange={setCriticalityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Criticità Asset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le criticità</SelectItem>
                <SelectItem value="critical">Solo Critici</SelectItem>
                <SelectItem value="high">Solo Alti</SelectItem>
                <SelectItem value="medium">Solo Medi</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                <SelectItem value="overdue">Scaduti</SelectItem>
                <SelectItem value="upcoming">In Scadenza (7gg)</SelectItem>
                <SelectItem value="missing_evidence">Senza Evidenze</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Criticità</TableHead>
                <TableHead>Responsabile</TableHead>
                <TableHead>Scadenza</TableHead>
                <TableHead>Evidenze</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Caricamento...
                  </TableCell>
                </TableRow>
              ) : filteredTests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nessun test trovato con i filtri selezionati
                  </TableCell>
                </TableRow>
              ) : (
                filteredTests.map((test: any) => {
                  const evidenceStatus = hasEvidenceForTest(test.id);
                  return (
                    <TableRow key={test.id} className={
                      test.next_due_date && isPast(new Date(test.next_due_date)) 
                        ? "bg-destructive/5" 
                        : ""
                    }>
                      <TableCell className="font-medium">
                        <div>
                          {test.test_name}
                          <div className="text-xs text-muted-foreground">{test.test_type}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {test.assets ? (
                          <span className="text-sm">{test.assets.name}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {test.assets?.criticality ? getCriticalityBadge(test.assets.criticality) : "-"}
                      </TableCell>
                      <TableCell>
                        {test.roles?.role_name || test.responsible_person || "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(test)}</TableCell>
                      <TableCell>
                        {evidenceStatus === null ? (
                          <Badge variant="secondary">Mai eseguito</Badge>
                        ) : evidenceStatus ? (
                          <Badge className="bg-green-500 gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Presente
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-orange-500 text-orange-600 gap-1">
                            <FileWarning className="h-3 w-3" />
                            Mancante
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {onExecuteTest && (
                          <Button size="sm" onClick={() => onExecuteTest(test)}>
                            Esegui
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default TestSchedulerDashboard;
