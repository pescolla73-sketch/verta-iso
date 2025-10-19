import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, FileText, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";

export default function PolicyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: policy, isLoading } = useQuery({
    queryKey: ["policy", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("policies")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-success text-success-foreground">Approvata</Badge>;
      case "in_review":
        return <Badge className="bg-warning text-warning-foreground">In Revisione</Badge>;
      case "draft":
        return <Badge variant="outline">Bozza</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDownloadPDF = () => {
    if (!policy) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    
    const lines = doc.splitTextToSize(policy.content || "", maxWidth);
    
    let y = 20;
    const lineHeight = 7;
    const pageHeight = doc.internal.pageSize.getHeight();

    lines.forEach((line: string) => {
      if (y + lineHeight > pageHeight - margin) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += lineHeight;
    });

    doc.save(`${policy.policy_name.replace(/\s+/g, '_')}.pdf`);
    toast.success("PDF scaricato con successo!");
  };

  const handleDownloadWord = async () => {
    if (!policy) return;

    const paragraphs = (policy.content || "").split('\n').map(text => 
      new Paragraph({
        children: [new TextRun(text)],
        spacing: { after: 200 }
      })
    );

    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs
      }]
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${policy.policy_name.replace(/\s+/g, '_')}.docx`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Word scaricato con successo!");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/policies")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Torna alle Politiche
        </Button>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Politica non trovata</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/policies")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Torna alle Politiche
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadPDF} className="gap-2">
            <Download className="h-4 w-4" />
            Scarica PDF
          </Button>
          <Button variant="outline" onClick={handleDownloadWord} className="gap-2">
            <FileText className="h-4 w-4" />
            Scarica Word
          </Button>
          <Button className="gap-2">
            <Edit className="h-4 w-4" />
            Modifica
          </Button>
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">{policy.policy_name}</CardTitle>
              {getStatusBadge(policy.status)}
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Versione:</span>
                <p className="text-foreground mt-1">{policy.version}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Approvata da:</span>
                <p className="text-foreground mt-1">{policy.approved_by || "-"}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Data approvazione:</span>
                <p className="text-foreground mt-1">
                  {policy.approval_date ? new Date(policy.approval_date).toLocaleDateString('it-IT') : "-"}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
              {policy.content || "Nessun contenuto disponibile"}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
