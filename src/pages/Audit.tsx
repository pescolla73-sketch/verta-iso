import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Download, Eye, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { logAuditEvent } from "@/utils/auditLog";

type AuditLog = {
  id: string;
  timestamp: string;
  user_name: string | null;
  user_email: string | null;
  action: string;
  entity_type: string;
  entity_name: string | null;
  entity_id: string | null;
  old_values: any;
  new_values: any;
  notes: string | null;
  ip_address: string | null;
  user_agent: string | null;
};

export default function Audit() {
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterEntity, setFilterEntity] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Fetch audit logs
  const { data: auditLogs = [], isLoading } = useQuery({
    queryKey: ["audit-logs", filterAction, filterEntity, filterDateFrom, filterDateTo],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(100);

      // Apply filters
      if (filterAction !== "all") {
        query = query.eq("action", filterAction);
      }
      if (filterEntity !== "all") {
        query = query.eq("entity_type", filterEntity);
      }
      if (filterDateFrom) {
        query = query.gte("timestamp", new Date(filterDateFrom).toISOString());
      }
      if (filterDateTo) {
        const endDate = new Date(filterDateTo);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte("timestamp", endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching audit logs:", error);
        toast.error("Errore nel caricamento dei log");
        throw error;
      }

      return (data || []) as AuditLog[];
    },
  });

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case "create":
        return "default";
      case "update":
        return "secondary";
      case "delete":
        return "destructive";
      case "view":
        return "outline";
      case "export":
        return "outline";
      default:
        return "outline";
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "create":
        return "Creazione";
      case "update":
        return "Modifica";
      case "delete":
        return "Eliminazione";
      case "view":
        return "Visualizzazione";
      case "export":
        return "Esportazione";
      default:
        return action;
    }
  };

  const getEntityLabel = (entityType: string) => {
    switch (entityType) {
      case "control":
        return "Controllo";
      case "risk":
        return "Rischio";
      case "asset":
        return "Asset";
      case "threat":
        return "Minaccia";
      case "policy":
        return "Policy";
      case "soa":
        return "SoA";
      case "audit":
        return "Audit";
      default:
        return entityType;
    }
  };

  const showLogDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetails(true);
  };

  const exportAuditLog = () => {
    const csv = [
      ["Data/Ora", "Utente", "Email", "Azione", "Entità", "Nome", "Note"].join(","),
      ...auditLogs.map((log) =>
        [
          format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss"),
          log.user_name,
          log.user_email,
          getActionLabel(log.action),
          getEntityLabel(log.entity_type),
          log.entity_name || "",
          log.notes || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Log esportato con successo");
  };

  const clearFilters = () => {
    setFilterAction("all");
    setFilterEntity("all");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  const testAuditLog = async () => {
    await logAuditEvent({
      action: 'create',
      entityType: 'control',
      entityName: 'Test Event - Controllo 8.7',
      notes: '🧪 Log di test per verificare funzionamento Registro Eventi'
    });
    
    toast.success('Log di test creato! Ricaricamento pagina...');
    
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">📋 Registro Eventi Piattaforma</h1>
          <p className="text-muted-foreground">
            Registro completo delle attività per compliance ISO 27001
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={testAuditLog} variant="outline" size="sm">
            🧪 Test Log
          </Button>
          <Button onClick={exportAuditLog} disabled={auditLogs.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Esporta CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger>
                <SelectValue placeholder="Tutte le azioni" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le azioni</SelectItem>
                <SelectItem value="create">Creazione</SelectItem>
                <SelectItem value="update">Modifica</SelectItem>
                <SelectItem value="delete">Eliminazione</SelectItem>
                <SelectItem value="view">Visualizzazione</SelectItem>
                <SelectItem value="export">Esportazione</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterEntity} onValueChange={setFilterEntity}>
              <SelectTrigger>
                <SelectValue placeholder="Tutte le entità" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le entità</SelectItem>
                <SelectItem value="control">Controlli</SelectItem>
                <SelectItem value="risk">Rischi</SelectItem>
                <SelectItem value="asset">Asset</SelectItem>
                <SelectItem value="threat">Minacce</SelectItem>
                <SelectItem value="policy">Policy</SelectItem>
                <SelectItem value="soa">SoA</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              placeholder="Da data..."
            />

            <Input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              placeholder="A data..."
            />
          </div>

          {(filterAction !== "all" ||
            filterEntity !== "all" ||
            filterDateFrom ||
            filterDateTo) && (
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Pulisci filtri
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8">Caricamento...</div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nessun log trovato
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Ora</TableHead>
                  <TableHead>Utente</TableHead>
                  <TableHead>Azione</TableHead>
                  <TableHead>Entità</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-right">Dettagli</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm", {
                        locale: it,
                      })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{log.user_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {log.user_email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(log.action)}>
                        {getActionLabel(log.action)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getEntityLabel(log.entity_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">
                        {log.entity_name || "-"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => showLogDetails(log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dettagli Audit Log</DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Timestamp
                  </label>
                  <p className="font-mono text-sm">
                    {format(
                      new Date(selectedLog.timestamp),
                      "dd/MM/yyyy HH:mm:ss",
                      { locale: it }
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Utente
                  </label>
                  <p>{selectedLog.user_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedLog.user_email}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Azione
                  </label>
                  <div className="mt-1">
                    <Badge variant={getActionBadgeVariant(selectedLog.action)}>
                      {getActionLabel(selectedLog.action)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Entità
                  </label>
                  <div className="mt-1">
                    <Badge variant="outline">
                      {getEntityLabel(selectedLog.entity_type)}
                    </Badge>
                  </div>
                </div>
              </div>

              {selectedLog.entity_name && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Nome Entità
                  </label>
                  <p className="mt-1">{selectedLog.entity_name}</p>
                </div>
              )}

              {selectedLog.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Note
                  </label>
                  <p className="mt-1 text-sm">{selectedLog.notes}</p>
                </div>
              )}

              {selectedLog.action === "update" &&
                selectedLog.old_values &&
                selectedLog.new_values && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Modifiche
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">
                          Prima:
                        </p>
                        <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-60">
                          {JSON.stringify(selectedLog.old_values, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">
                          Dopo:
                        </p>
                        <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-60">
                          {JSON.stringify(selectedLog.new_values, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Informazioni Tecniche
                </label>
                <div className="text-xs text-muted-foreground mt-1 space-y-1 bg-muted p-3 rounded">
                  {selectedLog.ip_address && (
                    <p>
                      <strong>IP:</strong> {selectedLog.ip_address}
                    </p>
                  )}
                  {selectedLog.user_agent && (
                    <p>
                      <strong>User Agent:</strong> {selectedLog.user_agent}
                    </p>
                  )}
                  <p>
                    <strong>ID Log:</strong> {selectedLog.id}
                  </p>
                  {selectedLog.entity_id && (
                    <p>
                      <strong>ID Entità:</strong> {selectedLog.entity_id}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
