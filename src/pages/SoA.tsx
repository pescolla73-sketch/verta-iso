import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, Eye, FileDown, Printer } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { generateSoAPDF, generateSoAWord, generateSoAHTML } from "@/utils/soaExport";
import { toast } from "sonner";
import { useState } from "react";

export default function SoA() {
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: controls = [] } = useQuery({
    queryKey: ['controls'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('controls')
        .select('*')
        .order('control_id');
      
      if (error) throw error;
      return data;
    },
  });

  const { data: organization } = useQuery({
    queryKey: ['organization'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization')
        .select('*')
        .limit(1)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const stats = {
    total: controls.length,
    applicable: controls.filter(c => c.status !== 'not_applicable').length,
    notApplicable: controls.filter(c => c.status === 'not_applicable').length,
  };

  const handleGeneratePDF = async () => {
    if (!organization) {
      toast.error('Dati organizzazione mancanti');
      return;
    }

    setIsGenerating(true);
    try {
      await generateSoAPDF({
        controls,
        organization,
        date: new Date().toLocaleDateString('it-IT'),
        version: 'v1.0',
      });
      toast.success('SoA PDF generato con successo!');
    } catch (error) {
      console.error('Errore generazione PDF:', error);
      toast.error('Errore nella generazione del PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateWord = async () => {
    if (!organization) {
      toast.error('Dati organizzazione mancanti');
      return;
    }

    setIsGenerating(true);
    try {
      await generateSoAWord({
        controls,
        organization,
        date: new Date().toLocaleDateString('it-IT'),
        version: 'v1.0',
      });
      toast.success('SoA Word generato con successo!');
    } catch (error) {
      console.error('Errore generazione Word:', error);
      toast.error('Errore nella generazione del Word');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateHTML = () => {
    if (!organization) {
      toast.error('Dati organizzazione mancanti');
      return;
    }

    try {
      generateSoAHTML({
        controls,
        organization,
        date: new Date().toLocaleDateString('it-IT'),
        version: 'v1.0',
      });
      toast.success('SoA HTML generato - pronto per la stampa!');
    } catch (error) {
      console.error('Errore generazione HTML:', error);
      toast.error('Errore nella generazione del HTML');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground">Statement of Applicability (SoA)</h1>
          <p className="text-muted-foreground mt-2">
            Genera e gestisci il documento SoA per la certificazione
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            className="gap-2" 
            onClick={handleGeneratePDF}
            disabled={isGenerating}
          >
            <Download className="h-4 w-4" />
            Scarica PDF
          </Button>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={handleGenerateHTML}
          >
            <Printer className="h-4 w-4" />
            Stampa HTML
          </Button>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={handleGenerateWord}
            disabled={isGenerating}
          >
            <FileDown className="h-4 w-4" />
            Scarica Word
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6" />
              </div>
              <p className="text-3xl font-bold text-foreground">{stats.total}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Controlli Totali
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="h-12 w-12 rounded-lg bg-success/10 text-success flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6" />
              </div>
              <p className="text-3xl font-bold text-foreground">{stats.applicable}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Controlli Applicabili
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="h-12 w-12 rounded-lg bg-muted/50 text-muted-foreground flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6" />
              </div>
              <p className="text-3xl font-bold text-foreground">{stats.notApplicable}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Controlli Non Applicabili
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Documenti SoA Generati</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                id: 1,
                name: "SoA_2024_Q4.pdf",
                date: "15 Dicembre 2024",
                version: "v1.2",
              },
              {
                id: 2,
                name: "SoA_2024_Q3.pdf",
                date: "15 Settembre 2024",
                version: "v1.1",
              },
              {
                id: 3,
                name: "SoA_2024_Q2.pdf",
                date: "15 Giugno 2024",
                version: "v1.0",
              },
            ].map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-smooth"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{doc.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {doc.date} • {doc.version}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
