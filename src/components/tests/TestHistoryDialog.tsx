import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { CheckCircle, XCircle, AlertCircle, ExternalLink, FileText, Image } from "lucide-react";

interface TestHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  test: any;
}

const TestHistoryDialog: React.FC<TestHistoryDialogProps> = ({ open, onOpenChange, test }) => {
  const { data: executions = [], isLoading } = useQuery({
    queryKey: ["test-history", test?.id],
    queryFn: async () => {
      if (!test?.id) return [];
      const { data, error } = await supabase
        .from("asset_test_executions")
        .select("*")
        .eq("test_id", test.id)
        .order("execution_date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!test?.id && open,
  });

  const getResultBadge = (result: string) => {
    switch (result) {
      case "passed":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Superato
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Fallito
          </Badge>
        );
      case "partial":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-600">
            <AlertCircle className="h-3 w-3 mr-1" />
            Parziale
          </Badge>
        );
      default:
        return <Badge variant="secondary">{result}</Badge>;
    }
  };

  const getFileIcon = (type: string) => {
    if (type?.startsWith("image/")) return <Image className="h-3 w-3" />;
    return <FileText className="h-3 w-3" />;
  };

  if (!test) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Storico: {test.test_name}</DialogTitle>
          <DialogDescription>
            Cronologia delle esecuzioni del test con evidenze allegate
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : executions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nessuna esecuzione registrata per questo test
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Esecutore</TableHead>
                <TableHead>Esito</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Problemi</TableHead>
                <TableHead>Evidenze</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {executions.map((exec: any) => (
                <TableRow key={exec.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(exec.execution_date), "dd/MM/yyyy", { locale: it })}
                  </TableCell>
                  <TableCell>{exec.executed_by}</TableCell>
                  <TableCell>{getResultBadge(exec.result)}</TableCell>
                  <TableCell className="max-w-[150px] truncate" title={exec.notes}>
                    {exec.notes || "-"}
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate" title={exec.issues_found}>
                    {exec.issues_found || "-"}
                  </TableCell>
                  <TableCell>
                    {exec.evidence_files && exec.evidence_files.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {exec.evidence_files.map((file: any, idx: number) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            asChild
                          >
                            <a href={file.url} target="_blank" rel="noopener noreferrer">
                              {getFileIcon(file.type)}
                              <span className="ml-1 max-w-[60px] truncate">{file.name}</span>
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TestHistoryDialog;
