import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format, differenceInDays, isPast, addDays } from "date-fns";
import { it } from "date-fns/locale";
import { Plus, Play, ClipboardCheck, AlertTriangle, Clock, CheckCircle, XCircle, Search, Filter, FileText, Trash2, Edit, Calendar } from "lucide-react";
import TestFormDialog from "@/components/tests/TestFormDialog";
import TestExecutionDialog from "@/components/tests/TestExecutionDialog";
import TestHistoryDialog from "@/components/tests/TestHistoryDialog";

const TestVerificationsPage = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [executionDialogOpen, setExecutionDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [testToDelete, setTestToDelete] = useState<any>(null);

  // Fetch tests with asset info
  const { data: tests = [], isLoading: testsLoading } = useQuery({
    queryKey: ["asset-tests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_tests")
        .select(`
          *,
          assets (id, name, asset_id, asset_type)
        `)
        .eq("is_active", true)
        .order("next_due_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch recent executions
  const { data: recentExecutions = [] } = useQuery({
    queryKey: ["recent-test-executions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_test_executions")
        .select(`
          *,
          asset_tests (test_name, test_type),
          assets (name, asset_id)
        `)
        .order("execution_date", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (testId: string) => {
      const { error } = await supabase.from("asset_tests").delete().eq("id", testId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-tests"] });
      toast.success("Test eliminato con successo");
      setTestToDelete(null);
    },
    onError: (error: any) => {
      toast.error("Errore durante l'eliminazione: " + error.message);
    },
  });

  // Calculate stats
  const overdueTests = tests.filter((t: any) => t.next_due_date && isPast(new Date(t.next_due_date)));
  const upcomingTests = tests.filter((t: any) => {
    if (!t.next_due_date) return false;
    const days = differenceInDays(new Date(t.next_due_date), new Date());
    return days >= 0 && days <= 7;
  });
  const failedRecent = recentExecutions.filter((e: any) => e.result === "failed").slice(0, 5);

  // Filter tests
  const filteredTests = tests.filter((test: any) => {
    const matchesSearch =
      test.test_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.test_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.assets?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "overdue") return matchesSearch && test.next_due_date && isPast(new Date(test.next_due_date));
    if (statusFilter === "upcoming") {
      if (!test.next_due_date) return false;
      const days = differenceInDays(new Date(test.next_due_date), new Date());
      return matchesSearch && days >= 0 && days <= 7;
    }
    return matchesSearch;
  });

  const getStatusBadge = (test: any) => {
    if (!test.next_due_date) {
      return <Badge variant="secondary">Da pianificare</Badge>;
    }
    const dueDate = new Date(test.next_due_date);
    if (isPast(dueDate)) {
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Scaduto</Badge>;
    }
    const days = differenceInDays(dueDate, new Date());
    if (days <= 7) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600"><Clock className="h-3 w-3 mr-1" />In scadenza</Badge>;
    }
    return <Badge variant="secondary"><Calendar className="h-3 w-3 mr-1" />{format(dueDate, "dd/MM/yyyy")}</Badge>;
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case "passed":
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Superato</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Fallito</Badge>;
      case "partial":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Parziale</Badge>;
      default:
        return <Badge variant="secondary">{result}</Badge>;
    }
  };

  const handleCreateTest = () => {
    setSelectedTest(null);
    setTestDialogOpen(true);
  };

  const handleEditTest = (test: any) => {
    setSelectedTest(test);
    setTestDialogOpen(true);
  };

  const handleExecuteTest = (test: any) => {
    setSelectedTest(test);
    setExecutionDialogOpen(true);
  };

  const handleViewHistory = (test: any) => {
    setSelectedTest(test);
    setHistoryDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Test e Verifiche Periodiche</h1>
          <p className="text-muted-foreground">
            Pianifica e monitora i test periodici sugli asset (backup, UPS, antivirus, ecc.)
          </p>
        </div>
        <Button onClick={handleCreateTest}>
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Test
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Test Pianificati</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tests.length}</div>
          </CardContent>
        </Card>
        <Card className={overdueTests.length > 0 ? "border-destructive" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              {overdueTests.length > 0 && <AlertTriangle className="h-4 w-4 text-destructive" />}
              Scaduti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overdueTests.length > 0 ? "text-destructive" : ""}`}>
              {overdueTests.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Scadenza (7gg)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{upcomingTests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Esecuzioni Totali</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentExecutions.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts for failed tests */}
      {failedRecent.length > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Test Falliti Recenti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {failedRecent.map((exec: any) => (
                <li key={exec.id} className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{exec.asset_tests?.test_name}</span>
                    <span className="text-muted-foreground ml-2">
                      ({exec.assets?.name || "Asset eliminato"})
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(exec.execution_date), "dd/MM/yyyy", { locale: it })}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="tests">
        <TabsList>
          <TabsTrigger value="tests">Test Pianificati</TabsTrigger>
          <TabsTrigger value="history">Storico Esecuzioni</TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca test, tipo o asset..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                <SelectItem value="overdue">Scaduti</SelectItem>
                <SelectItem value="upcoming">In Scadenza</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tests Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Frequenza</TableHead>
                    <TableHead>Prossima Scadenza</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testsLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Caricamento...
                      </TableCell>
                    </TableRow>
                  ) : filteredTests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nessun test trovato. Crea il primo test periodico!
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTests.map((test: any) => (
                      <TableRow key={test.id}>
                        <TableCell className="font-medium">{test.test_name}</TableCell>
                        <TableCell>{test.test_type}</TableCell>
                        <TableCell>
                          {test.assets ? (
                            <span className="text-sm">
                              {test.assets.name}
                              <span className="text-muted-foreground ml-1">({test.assets.asset_id})</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{test.frequency_days} giorni</TableCell>
                        <TableCell>
                          {test.next_due_date
                            ? format(new Date(test.next_due_date), "dd/MM/yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell>{getStatusBadge(test)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleExecuteTest(test)}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Esegui
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewHistory(test)}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditTest(test)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Conferma Eliminazione</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Vuoi eliminare il test "{test.test_name}"? 
                                    Questa azione non può essere annullata.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteMutation.mutate(test.id)}
                                    className="bg-destructive text-destructive-foreground"
                                  >
                                    Elimina
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Storico Esecuzioni</CardTitle>
              <CardDescription>Tutte le esecuzioni dei test con evidenze caricate</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Test</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Esecutore</TableHead>
                    <TableHead>Esito</TableHead>
                    <TableHead>Evidenze</TableHead>
                    <TableHead>Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentExecutions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nessuna esecuzione registrata
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentExecutions.map((exec: any) => (
                      <TableRow key={exec.id}>
                        <TableCell>
                          {format(new Date(exec.execution_date), "dd/MM/yyyy", { locale: it })}
                        </TableCell>
                        <TableCell className="font-medium">
                          {exec.asset_tests?.test_name || "Test eliminato"}
                        </TableCell>
                        <TableCell>{exec.assets?.name || "-"}</TableCell>
                        <TableCell>{exec.executed_by}</TableCell>
                        <TableCell>{getResultBadge(exec.result)}</TableCell>
                        <TableCell>
                          {exec.evidence_files && exec.evidence_files.length > 0 ? (
                            <Badge variant="secondary">
                              {exec.evidence_files.length} file
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {exec.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <TestFormDialog
        open={testDialogOpen}
        onOpenChange={setTestDialogOpen}
        test={selectedTest}
      />
      <TestExecutionDialog
        open={executionDialogOpen}
        onOpenChange={setExecutionDialogOpen}
        test={selectedTest}
      />
      <TestHistoryDialog
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        test={selectedTest}
      />
    </div>
  );
};

export default TestVerificationsPage;
