import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Controls() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const navigate = useNavigate();

  const { data: controls, isLoading, error: queryError } = useQuery({
    queryKey: ["controls"],
    queryFn: async () => {
      console.log("Fetching controls from Supabase...");
      const { data, error } = await supabase
        .from("controls")
        .select("*")
        .order("control_id");
      
      if (error) {
        console.error("Supabase error:", error);
        toast.error(`Errore nel caricamento dei controlli: ${error.message}`);
        throw error;
      }
      
      console.log("Controls fetched:", data?.length || 0, "records");
      return data || [];
    },
  });

  // Log query error if present
  if (queryError) {
    console.error("Query error:", queryError);
  }

  const controlCategories = useMemo(() => {
    if (!controls) return [
      { id: "all", name: "Tutti", count: 0 },
      { id: "Organizzativi", name: "Organizzativi", count: 0 },
      { id: "Persone", name: "Persone", count: 0 },
      { id: "Fisici", name: "Fisici", count: 0 },
      { id: "Tecnologici", name: "Tecnologici", count: 0 },
    ];

    const categoryCounts = controls.reduce((acc, control) => {
      acc[control.domain] = (acc[control.domain] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { id: "all", name: "Tutti", count: controls.length },
      { id: "Organizzativi", name: "Organizzativi", count: categoryCounts["Organizzativi"] || 0 },
      { id: "Persone", name: "Persone", count: categoryCounts["Persone"] || 0 },
      { id: "Fisici", name: "Fisici", count: categoryCounts["Fisici"] || 0 },
      { id: "Tecnologici", name: "Tecnologici", count: categoryCounts["Tecnologici"] || 0 },
    ];
  }, [controls]);

  const filteredControls = useMemo(() => {
    if (!controls) return [];

    return controls.filter((control) => {
      const matchesSearch = 
        control.control_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        control.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = 
        selectedCategory === "all" || control.domain === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [controls, searchQuery, selectedCategory]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "implemented":
        return <Badge className="bg-success text-success-foreground">Implementato</Badge>;
      case "in_progress":
        return <Badge className="bg-warning text-warning-foreground">In Corso</Badge>;
      case "not_implemented":
        return <Badge variant="destructive">Non Implementato</Badge>;
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
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
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
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredControls.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nessun controllo trovato
                </p>
              ) : (
                filteredControls.map((control) => (
                  <div
                    key={control.id}
                    onClick={() => navigate(`/controls/${control.id}`)}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-smooth cursor-pointer"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="font-mono">
                          {control.control_id}
                        </Badge>
                        <h3 className="font-semibold text-foreground">
                          {control.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Categoria: {control.domain}</span>
                        <span>Responsabile: {control.responsible || "Non assegnato"}</span>
                        {control.last_verification_date && (
                          <span>Ultima verifica: {new Date(control.last_verification_date).toLocaleDateString("it-IT")}</span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">{getStatusBadge(control.status)}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
