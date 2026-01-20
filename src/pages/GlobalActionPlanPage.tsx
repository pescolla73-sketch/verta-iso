import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, isBefore, isAfter, addDays } from "date-fns";
import { it } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClipboardList,
  AlertTriangle,
  Wrench,
  FileCheck,
  GraduationCap,
  Search,
  Calendar,
  User,
  Filter,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ActionItem {
  id: string;
  type: "risk" | "improvement" | "audit" | "training";
  title: string;
  description?: string;
  responsible: string;
  deadline: string;
  status: string;
  priority?: string;
  source?: string;
  link: string;
}

export default function GlobalActionPlanPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [responsibleFilter, setResponsibleFilter] = useState<string>("all");
  const [deadlineFilter, setDeadlineFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Fetch risks to treat
  const { data: risks = [], isLoading: risksLoading } = useQuery({
    queryKey: ["action-plan-risks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risks")
        .select("id, name, description, treatment_responsible, treatment_deadline, status, inherent_risk_level")
        .in("status", ["Identificato", "In trattamento"])
        .order("inherent_risk_score", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch open improvement actions
  const { data: improvements = [], isLoading: improvementsLoading } = useQuery({
    queryKey: ["action-plan-improvements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("improvement_actions")
        .select("id, title, description, responsible_person, target_date, status, priority, source")
        .in("status", ["open", "in_progress"])
        .order("target_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch scheduled audits
  const { data: audits = [], isLoading: auditsLoading } = useQuery({
    queryKey: ["action-plan-audits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("internal_audits")
        .select("id, audit_code, audit_scope, auditor_name, audit_date, status")
        .in("status", ["planned", "in_progress"])
        .order("audit_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch planned trainings
  const { data: trainings = [], isLoading: trainingsLoading } = useQuery({
    queryKey: ["action-plan-trainings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_records")
        .select("id, training_title, employee_name, training_date, status")
        .eq("status", "planned")
        .order("training_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const isLoading = risksLoading || improvementsLoading || auditsLoading || trainingsLoading;

  // Combine all actions into a unified list
  const allActions: ActionItem[] = useMemo(() => {
    const actions: ActionItem[] = [];

    // Add risks
    risks.forEach((risk) => {
      actions.push({
        id: risk.id,
        type: "risk",
        title: risk.name,
        description: risk.description,
        responsible: risk.treatment_responsible || "Non assegnato",
        deadline: risk.treatment_deadline || "",
        status: risk.status,
        priority: risk.inherent_risk_level,
        link: "/risk-assessment",
      });
    });

    // Add improvements
    improvements.forEach((imp) => {
      actions.push({
        id: imp.id,
        type: "improvement",
        title: imp.title,
        description: imp.description,
        responsible: imp.responsible_person || "Non assegnato",
        deadline: imp.target_date || "",
        status: imp.status,
        priority: imp.priority,
        source: imp.source,
        link: `/improvement/${imp.id}`,
      });
    });

    // Add audits
    audits.forEach((audit) => {
      actions.push({
        id: audit.id,
        type: "audit",
        title: `Audit: ${audit.audit_scope}`,
        description: audit.audit_code,
        responsible: audit.auditor_name || "Non assegnato",
        deadline: audit.audit_date || "",
        status: audit.status,
        link: `/audit-interni/esegui/${audit.id}`,
      });
    });

    // Add trainings
    trainings.forEach((training) => {
      actions.push({
        id: training.id,
        type: "training",
        title: training.training_title,
        responsible: training.employee_name || "Non assegnato",
        deadline: training.training_date || "",
        status: training.status || "planned",
        link: "/training",
      });
    });

    return actions;
  }, [risks, improvements, audits, trainings]);

  // Get unique responsibles for filter
  const uniqueResponsibles = useMemo(() => {
    const responsibles = new Set(allActions.map((a) => a.responsible).filter(Boolean));
    return Array.from(responsibles).sort();
  }, [allActions]);

  // Filter actions
  const filteredActions = useMemo(() => {
    return allActions.filter((action) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        action.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        action.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        action.responsible.toLowerCase().includes(searchQuery.toLowerCase());

      // Responsible filter
      const matchesResponsible =
        responsibleFilter === "all" || action.responsible === responsibleFilter;

      // Type filter
      const matchesType = typeFilter === "all" || action.type === typeFilter;

      // Deadline filter
      let matchesDeadline = true;
      if (deadlineFilter !== "all" && action.deadline) {
        const deadline = new Date(action.deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (deadlineFilter) {
          case "overdue":
            matchesDeadline = isBefore(deadline, today);
            break;
          case "this_week":
            matchesDeadline = isBefore(deadline, addDays(today, 7)) && !isBefore(deadline, today);
            break;
          case "this_month":
            matchesDeadline = isBefore(deadline, addDays(today, 30)) && !isBefore(deadline, today);
            break;
          case "future":
            matchesDeadline = isAfter(deadline, addDays(today, 30));
            break;
        }
      } else if (deadlineFilter === "no_deadline") {
        matchesDeadline = !action.deadline;
      }

      return matchesSearch && matchesResponsible && matchesType && matchesDeadline;
    });
  }, [allActions, searchQuery, responsibleFilter, typeFilter, deadlineFilter]);

  // Stats
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      total: allActions.length,
      overdue: allActions.filter((a) => a.deadline && isBefore(new Date(a.deadline), today)).length,
      thisWeek: allActions.filter((a) => {
        if (!a.deadline) return false;
        const deadline = new Date(a.deadline);
        return isBefore(deadline, addDays(today, 7)) && !isBefore(deadline, today);
      }).length,
      byType: {
        risk: allActions.filter((a) => a.type === "risk").length,
        improvement: allActions.filter((a) => a.type === "improvement").length,
        audit: allActions.filter((a) => a.type === "audit").length,
        training: allActions.filter((a) => a.type === "training").length,
      },
    };
  }, [allActions]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "risk":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "improvement":
        return <Wrench className="h-4 w-4 text-blue-500" />;
      case "audit":
        return <FileCheck className="h-4 w-4 text-purple-500" />;
      case "training":
        return <GraduationCap className="h-4 w-4 text-green-500" />;
      default:
        return <ClipboardList className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      risk: "Rischio",
      improvement: "Miglioramento",
      audit: "Audit",
      training: "Formazione",
    };
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      risk: "destructive",
      improvement: "default",
      audit: "secondary",
      training: "outline",
    };
    return (
      <Badge variant={variants[type] || "outline"}>
        {labels[type] || type}
      </Badge>
    );
  };

  const getDeadlineBadge = (deadline: string) => {
    if (!deadline) return <span className="text-muted-foreground">-</span>;

    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isOverdue = isBefore(deadlineDate, today);
    const isSoon = isBefore(deadlineDate, addDays(today, 7));

    return (
      <Badge
        variant={isOverdue ? "destructive" : isSoon ? "default" : "outline"}
        className="flex items-center gap-1"
      >
        <Calendar className="h-3 w-3" />
        {format(deadlineDate, "dd/MM/yyyy", { locale: it })}
      </Badge>
    );
  };

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null;
    
    const colors: Record<string, string> = {
      critical: "bg-red-500",
      Critico: "bg-red-500",
      high: "bg-orange-500",
      Alto: "bg-orange-500",
      medium: "bg-yellow-500",
      Medio: "bg-yellow-500",
      low: "bg-green-500",
      Basso: "bg-green-500",
    };

    return (
      <Badge className={colors[priority] || "bg-gray-500"}>
        {priority}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ClipboardList className="h-8 w-8" />
            Piano d'Azione Globale
          </h1>
          <p className="text-muted-foreground">
            Vista centralizzata di tutti i compiti pendenti dell'ISMS
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {allActions.length} task totali
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className={stats.overdue > 0 ? "border-destructive" : ""}>
          <CardHeader className="pb-2">
            <CardDescription>⚠️ Scaduti</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${stats.overdue > 0 ? "text-destructive" : ""}`}>
              {stats.overdue}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>📅 Questa Settimana</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-500">{stats.thisWeek}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>🎯 Rischi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.byType.risk}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>🔧 Miglioramenti</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.byType.improvement}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>📋 Audit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.byType.audit}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>🎓 Formazione</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.byType.training}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca task..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i tipi</SelectItem>
                <SelectItem value="risk">Rischi</SelectItem>
                <SelectItem value="improvement">Miglioramenti</SelectItem>
                <SelectItem value="audit">Audit</SelectItem>
                <SelectItem value="training">Formazione</SelectItem>
              </SelectContent>
            </Select>

            <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
              <SelectTrigger className="w-[180px]">
                <User className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Responsabile" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                {uniqueResponsibles.map((resp) => (
                  <SelectItem key={resp} value={resp}>
                    {resp}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={deadlineFilter} onValueChange={setDeadlineFilter}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Scadenza" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le date</SelectItem>
                <SelectItem value="overdue">⚠️ Scaduti</SelectItem>
                <SelectItem value="this_week">📅 Questa settimana</SelectItem>
                <SelectItem value="this_month">📆 Questo mese</SelectItem>
                <SelectItem value="future">🔮 Oltre 30 giorni</SelectItem>
                <SelectItem value="no_deadline">❓ Senza scadenza</SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery || responsibleFilter !== "all" || typeFilter !== "all" || deadlineFilter !== "all") && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchQuery("");
                  setResponsibleFilter("all");
                  setTypeFilter("all");
                  setDeadlineFilter("all");
                }}
              >
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Task Pendenti ({filteredActions.length})
          </CardTitle>
          <CardDescription>
            Clicca su una riga per visualizzare i dettagli
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredActions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nessun task trovato</p>
              <p className="text-sm">Prova a modificare i filtri</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Tipo</TableHead>
                    <TableHead>Titolo</TableHead>
                    <TableHead>Responsabile</TableHead>
                    <TableHead>Scadenza</TableHead>
                    <TableHead>Priorità</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActions.map((action) => (
                    <TableRow
                      key={`${action.type}-${action.id}`}
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => navigate(action.link)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(action.type)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{action.title}</p>
                          {action.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {action.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{action.responsible}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getDeadlineBadge(action.deadline)}</TableCell>
                      <TableCell>{getPriorityBadge(action.priority)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{action.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
