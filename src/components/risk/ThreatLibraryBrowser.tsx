import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, AlertTriangle, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CustomThreatDialog } from "./CustomThreatDialog";

interface ThreatLibraryBrowserProps {
  onSelectThreat: (threatId: string) => void;
  selectedSector?: string;
}

interface Threat {
  id: string;
  threat_id: string;
  name: string;
  description: string;
  category: string;
  is_custom: boolean;
  organization_id?: string;
  nis2_incident_type?: string;
  typical_probability?: number;
  typical_impact?: number;
  iso27001_controls?: string[];
  relevant_sectors?: string[];
}

const CATEGORIES = [
  { value: "all", label: "Tutte le categorie" },
  { value: "Cyber/Technical", label: "🔐 Cyber/Technical" },
  { value: "Human", label: "👥 Human" },
  { value: "Natural/Environmental", label: "🌍 Natural/Environmental" },
  { value: "Organizational", label: "🏢 Organizational" },
  { value: "Legal/Compliance", label: "⚖️ Legal/Compliance" },
  { value: "Physical", label: "🔒 Physical" },
  { value: "Reputational", label: "💼 Reputational" },
  { value: "Technical", label: "💻 Technical" }
];

const NIS2_TYPES = [
  { value: "all", label: "Tutti i tipi" },
  { value: "Availability disruption", label: "Availability disruption" },
  { value: "Confidentiality breach", label: "Confidentiality breach" },
  { value: "Integrity compromise", label: "Integrity compromise" }
];

export function ThreatLibraryBrowser({ onSelectThreat, selectedSector }: ThreatLibraryBrowserProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [nis2Filter, setNis2Filter] = useState("all");
  const [selectedThreats, setSelectedThreats] = useState<string[]>([]);
  const [editingThreat, setEditingThreat] = useState<Threat | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [threatToDelete, setThreatToDelete] = useState<Threat | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const queryClient = useQueryClient();

  const { data: threats = [], isLoading, error: queryError } = useQuery({
    queryKey: ["threat-library", categoryFilter, nis2Filter, selectedSector],
    queryFn: async () => {
      console.log('🔍 Loading threats with filters:', {
        categoryFilter,
        nis2Filter,
        selectedSector
      });

      try {
        // Simplified query - get all threats (RLS will handle access control)
        let query = supabase
          .from("threat_library")
          .select("*")
          .order("created_at", { ascending: false });

        // Apply filters
        if (categoryFilter !== "all") {
          query = query.eq("category", categoryFilter);
        }

        if (nis2Filter !== "all") {
          query = query.eq("nis2_incident_type", nis2Filter);
        }

        const { data, error } = await query;
        
        console.log('📊 Loaded threats:', data?.length || 0);
        
        if (error) {
          console.error('❌ Query error:', error);
          console.error('💥 Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw error;
        }

        // Filter by sector if provided (client-side filtering)
        if (selectedSector && data) {
          const filtered = data.filter(t => 
            !t.relevant_sectors || 
            t.relevant_sectors.length === 0 || 
            t.relevant_sectors.includes(selectedSector)
          );
          console.log('✅ Filtered by sector:', filtered.length);
          return filtered;
        }

        console.log('✅ Returning all threats:', data?.length || 0);
        return data || [];
        
      } catch (err) {
        console.error('💥 Unexpected error loading threats:', err);
        toast.error('Errore nel caricamento minacce', {
          description: err instanceof Error ? err.message : 'Errore sconosciuto'
        });
        throw err;
      }
    },
    retry: 1,
    retryDelay: 1000
  });

  const filteredThreats = threats.filter(threat =>
    threat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    threat.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    threat.threat_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRiskBadgeColor = (probability: number, impact: number) => {
    const score = probability * impact;
    if (score >= 17) return "destructive";
    if (score >= 13) return "default";
    if (score >= 7) return "secondary";
    return "outline";
  };

  const toggleThreat = (threatId: string) => {
    setSelectedThreats(prev =>
      prev.includes(threatId)
        ? prev.filter(id => id !== threatId)
        : [...prev, threatId]
    );
  };

  const handleEditThreat = (threat: Threat, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingThreat(threat);
    setIsEditDialogOpen(true);
  };

  const handleDeleteThreat = async (threat: Threat, e: React.MouseEvent) => {
    e.stopPropagation();
    
    console.log('🗑️ Attempting to delete threat:', threat.threat_id);
    
    try {
      // Check if threat is used in any risks (threat_id might not exist in all cases)
      const { data: risks, error } = await supabase
        .from('risks')
        .select('id, risk_id, name')
        .eq('threat_id', threat.threat_id);
      
      if (error) {
        // If column doesn't exist (42703) or other errors, allow deletion
        console.warn('⚠️ Could not check usage, proceeding with delete:', error);
        if (error.code !== '42703') {
          console.error('Usage check error:', error);
        }
      }
      
      // Only block if we found risks actually using it
      if (risks && risks.length > 0) {
        toast.error('Impossibile eliminare', {
          description: `Questa minaccia è usata in ${risks.length} rischi. Elimina prima i rischi.`
        });
        return;
      }
      
      // Proceed with delete
      setThreatToDelete(threat);
      setShowDeleteConfirm(true);
      
    } catch (error) {
      console.error('💥 Error in delete flow:', error);
      toast.error('Errore', {
        description: error instanceof Error ? error.message : 'Errore sconosciuto'
      });
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (threatId: string) => {
      const { error } = await supabase
        .from('threat_library')
        .delete()
        .eq('id', threatId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threat-library'] });
      toast.success('🗑️ Minaccia eliminata');
      setShowDeleteConfirm(false);
      setThreatToDelete(null);
    },
    onError: (error: any) => {
      console.error('Delete error:', error);
      toast.error('Errore nell\'eliminazione: ' + error.message);
    }
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Libreria Minacce - ISO 27005 + NIS2
              </CardTitle>
              <CardDescription>
                {selectedSector 
                  ? `Minacce rilevanti per il settore ${selectedSector}`
                  : "Catalogo professionale di minacce basato su standard EU"}
              </CardDescription>
            </div>
            <Badge variant="outline">{filteredThreats.length} minacce</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca minacce..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={nis2Filter} onValueChange={setNis2Filter}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NIS2_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedThreats.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
              <span className="text-sm font-medium">
                {selectedThreats.length} minacce selezionate
              </span>
              <Button
                size="sm"
                onClick={() => {
                  selectedThreats.forEach(id => onSelectThreat(id));
                  setSelectedThreats([]);
                }}
              >
                Valuta Selezionate
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {queryError && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-center text-destructive">
                ❌ Errore nel caricamento: {queryError instanceof Error ? queryError.message : 'Errore sconosciuto'}
              </p>
            </CardContent>
          </Card>
        )}
        {isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Caricamento...</p>
            </CardContent>
          </Card>
        ) : filteredThreats.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Nessuna minaccia trovata</p>
            </CardContent>
          </Card>
        ) : (
          filteredThreats.map((threat) => (
            <Card 
              key={threat.id}
              className={`cursor-pointer transition-colors ${
                selectedThreats.includes(threat.threat_id) ? 'border-primary bg-accent' : ''
              }`}
              onClick={() => toggleThreat(threat.threat_id)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="font-mono text-xs">
                            {threat.threat_id}
                          </Badge>
                          <Badge>{threat.category}</Badge>
                        </div>
                        <h3 className="font-semibold text-lg">{threat.name}</h3>
                      </div>
                      <Badge 
                        variant={getRiskBadgeColor(threat.typical_probability || 3, threat.typical_impact || 3)}
                      >
                        {threat.typical_probability && threat.typical_impact 
                          ? `Rischio: ${threat.typical_probability * threat.typical_impact}`
                          : "N/A"}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground">{threat.description}</p>

                    <div className="flex flex-wrap gap-2">
                      {threat.nis2_incident_type && (
                        <Badge variant="secondary" className="text-xs">
                          NIS2: {threat.nis2_incident_type}
                        </Badge>
                      )}
                      {threat.typical_probability && (
                        <Badge variant="outline" className="text-xs">
                          P: {threat.typical_probability}/5
                        </Badge>
                      )}
                      {threat.typical_impact && (
                        <Badge variant="outline" className="text-xs">
                          I: {threat.typical_impact}/5
                        </Badge>
                      )}
                    </div>

                    {threat.iso27001_controls && threat.iso27001_controls.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs text-muted-foreground">Controlli ISO:</span>
                        {threat.iso27001_controls.map((control: string) => (
                          <Badge key={control} variant="outline" className="text-xs">
                            {control}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {threat.is_custom && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => handleEditThreat(threat, e)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Modifica
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => handleDeleteThreat(threat, e)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Elimina
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectThreat(threat.threat_id);
                      }}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Valuta
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <CustomThreatDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        initialData={editingThreat}
        onThreatCreated={() => {
          setIsEditDialogOpen(false);
          setEditingThreat(null);
        }}
      />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>🗑️ Eliminare questa minaccia?</AlertDialogTitle>
            <AlertDialogDescription>
              Stai per eliminare la minaccia personalizzata:
              <div className="mt-2 p-3 bg-muted rounded">
                <strong>{threatToDelete?.name}</strong>
              </div>
              <p className="mt-2">
                Questa azione è <strong>irreversibile</strong>.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>❌ Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => threatToDelete && deleteMutation.mutate(threatToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              🗑️ Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}