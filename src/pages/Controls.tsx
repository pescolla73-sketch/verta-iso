import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter } from "lucide-react";

export default function Controls() {
  const [searchQuery, setSearchQuery] = useState("");

  const controlCategories = [
    { id: "all", name: "Tutti", count: 93 },
    { id: "organizational", name: "Organizzativi", count: 37 },
    { id: "people", name: "Persone", count: 8 },
    { id: "physical", name: "Fisici", count: 14 },
    { id: "technological", name: "Tecnologici", count: 34 },
  ];

  const mockControls = [
    {
      id: "A.5.1",
      name: "Politiche per la sicurezza delle informazioni",
      category: "Organizzativi",
      status: "compliant",
      implementation: 100,
      lastReview: "2024-12-01",
    },
    {
      id: "A.5.2",
      name: "Ruoli e responsabilità per la sicurezza delle informazioni",
      category: "Organizzativi",
      status: "partial",
      implementation: 75,
      lastReview: "2024-11-28",
    },
    {
      id: "A.5.3",
      name: "Segregazione dei compiti",
      category: "Organizzativi",
      status: "non-compliant",
      implementation: 40,
      lastReview: "2024-11-20",
    },
    {
      id: "A.6.1",
      name: "Screening",
      category: "Persone",
      status: "compliant",
      implementation: 100,
      lastReview: "2024-12-05",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "compliant":
        return <Badge className="bg-success text-success-foreground">Conforme</Badge>;
      case "partial":
        return <Badge className="bg-warning text-warning-foreground">Parziale</Badge>;
      case "non-compliant":
        return <Badge variant="destructive">Non Conforme</Badge>;
      default:
        return <Badge variant="outline">Da Valutare</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground">Controlli ISO 27001:2022</h1>
          <p className="text-muted-foreground mt-2">
            Gestisci i 93 controlli dell'Annex A
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtra
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Categorie Controlli</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              {controlCategories.map((category) => (
                <TabsTrigger key={category.id} value={category.id}>
                  {category.name} ({category.count})
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista Controlli</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca controlli..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockControls.map((control) => (
              <div
                key={control.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-smooth cursor-pointer"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline" className="font-mono">
                      {control.id}
                    </Badge>
                    <h3 className="font-semibold text-foreground">
                      {control.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Categoria: {control.category}</span>
                    <span>Implementazione: {control.implementation}%</span>
                    <span>Ultima revisione: {control.lastReview}</span>
                  </div>
                  <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden max-w-xs">
                    <div
                      className="h-full bg-primary transition-smooth"
                      style={{ width: `${control.implementation}%` }}
                    />
                  </div>
                </div>
                <div className="ml-4">{getStatusBadge(control.status)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
