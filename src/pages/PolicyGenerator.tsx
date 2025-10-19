import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Wand2, Download, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";

const POLICY_TYPES = [
  { value: "information_security", label: "Politica di Sicurezza delle Informazioni" },
  { value: "access_control", label: "Politica di Controllo degli Accessi" },
  { value: "backup", label: "Politica di Backup" },
  { value: "incident_response", label: "Politica di Risposta agli Incidenti" },
  { value: "acceptable_use", label: "Politica di Uso Accettabile" },
];

export default function PolicyGenerator() {
  const navigate = useNavigate();
  const [selectedPolicy, setSelectedPolicy] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [sector, setSector] = useState("");
  const [ciso, setCiso] = useState("");
  const [dpo, setDpo] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerate = async () => {
    if (!selectedPolicy || !organizationName) {
      toast.error("Seleziona un tipo di politica e inserisci il nome dell'organizzazione");
      return;
    }

    setIsGenerating(true);
    try {
      // Fetch some organization context from database
      const { data: controls } = await supabase
        .from("controls")
        .select("control_id, status")
        .eq("status", "implemented");

      const { data: assets } = await supabase
        .from("assets")
        .select("name")
        .eq("criticality", "high")
        .limit(5);

      const organizationData = {
        name: organizationName,
        sector,
        ciso,
        dpo,
        criticalAssets: assets?.map(a => a.name) || [],
        implementedControls: controls?.length || 0,
      };

      const { data, error } = await supabase.functions.invoke("generate-policy", {
        body: { 
          policyType: POLICY_TYPES.find(p => p.value === selectedPolicy)?.label,
          organizationData 
        },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedContent(data.content);
      toast.success("Politica generata con successo!");
    } catch (error: any) {
      console.error("Error generating policy:", error);
      toast.error(error.message || "Errore nella generazione della politica");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!generatedContent) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    
    // Split content into lines that fit the page
    const lines = doc.splitTextToSize(generatedContent, maxWidth);
    
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

    const policyLabel = POLICY_TYPES.find(p => p.value === selectedPolicy)?.label || "policy";
    doc.save(`${policyLabel.replace(/\s+/g, '_')}.pdf`);
    toast.success("PDF scaricato con successo!");
  };

  const handleDownloadWord = async () => {
    if (!generatedContent) return;

    const paragraphs = generatedContent.split('\n').map(text => 
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
    const policyLabel = POLICY_TYPES.find(p => p.value === selectedPolicy)?.label || "policy";
    link.download = `${policyLabel.replace(/\s+/g, '_')}.docx`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Word scaricato con successo!");
  };

  const handleSaveToDatabase = async () => {
    if (!generatedContent || !selectedPolicy) return;

    setIsSaving(true);
    try {
      const policyLabel = POLICY_TYPES.find(p => p.value === selectedPolicy)?.label || "Nuova Politica";
      
      const { error } = await supabase
        .from("policies")
        .insert({
          policy_name: policyLabel,
          policy_type: selectedPolicy,
          content: generatedContent,
          status: "draft",
          version: "1.0",
        });

      if (error) throw error;

      toast.success("Politica salvata nel database!");
      navigate("/policies");
    } catch (error: any) {
      console.error("Error saving policy:", error);
      toast.error("Errore nel salvataggio della politica");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/policies")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Torna alle Politiche
          </Button>
          <div>
            <h1 className="text-foreground">Generatore di Politiche</h1>
            <p className="text-muted-foreground mt-2">
              Genera politiche di sicurezza personalizzate con l'AI
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Configurazione</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="policyType">Tipo di Politica</Label>
              <Select value={selectedPolicy} onValueChange={setSelectedPolicy}>
                <SelectTrigger id="policyType">
                  <SelectValue placeholder="Seleziona tipo di politica" />
                </SelectTrigger>
                <SelectContent>
                  {POLICY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="orgName">Nome Organizzazione *</Label>
              <Input
                id="orgName"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="Es: Acme Corporation S.p.A."
              />
            </div>

            <div>
              <Label htmlFor="sector">Settore</Label>
              <Input
                id="sector"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                placeholder="Es: Tecnologia, Sanità, Finanza"
              />
            </div>

            <div>
              <Label htmlFor="ciso">CISO</Label>
              <Input
                id="ciso"
                value={ciso}
                onChange={(e) => setCiso(e.target.value)}
                placeholder="Nome del Chief Information Security Officer"
              />
            </div>

            <div>
              <Label htmlFor="dpo">DPO</Label>
              <Input
                id="dpo"
                value={dpo}
                onChange={(e) => setDpo(e.target.value)}
                placeholder="Nome del Data Protection Officer"
              />
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || !selectedPolicy || !organizationName}
              className="w-full gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generazione in corso...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Genera Politica
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Anteprima</CardTitle>
              {generatedContent && (
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleDownloadPDF}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    PDF
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleDownloadWord}
                    className="gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Word
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSaveToDatabase}
                    disabled={isSaving}
                    className="gap-2"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Salva"
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!generatedContent ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-center text-muted-foreground">
                <FileText className="h-16 w-16 mb-4 opacity-20" />
                <p>Configura i parametri e genera una politica</p>
                <p className="text-sm mt-2">L'anteprima apparirà qui</p>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {generatedContent}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}