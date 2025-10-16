import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, Eye } from "lucide-react";

export default function SoA() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground">Statement of Applicability (SoA)</h1>
          <p className="text-muted-foreground mt-2">
            Genera e gestisci il documento SoA per la certificazione
          </p>
        </div>
        <Button className="gap-2">
          <Download className="h-4 w-4" />
          Genera SoA
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6" />
              </div>
              <p className="text-3xl font-bold text-foreground">93</p>
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
              <p className="text-3xl font-bold text-foreground">68</p>
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
              <p className="text-3xl font-bold text-foreground">25</p>
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
