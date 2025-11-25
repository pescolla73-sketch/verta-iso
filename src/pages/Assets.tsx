import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Plus, Search, Server, Monitor, Database, Cloud, Users, MoreVertical, Edit, Trash2, Eye } from "lucide-react";
import { AssetFormDialog } from "@/components/assets/AssetFormDialog";
import { AssetDetailDialog } from "@/components/assets/AssetDetailDialog";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { logAuditEvent } from "@/utils/auditLog";

export default function Assets() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [criticalityFilter, setCriticalityFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [assetToDelete, setAssetToDelete] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: assets, isLoading } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredAssets = assets?.filter((asset) => {
    const matchesSearch = 
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.asset_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || asset.asset_type === typeFilter;
    const matchesCriticality = criticalityFilter === "all" || asset.criticality === criticalityFilter;
    const matchesOwner = ownerFilter === "all" || asset.owner === ownerFilter;
    return matchesSearch && matchesType && matchesCriticality && matchesOwner;
  });

  // Get unique owners for filter dropdown
  const uniqueOwners = [...new Set(assets?.map(a => a.owner).filter(Boolean))] as string[];

  const assetStats = {
    Hardware: assets?.filter((a) => a.asset_type === "Hardware").length || 0,
    Software: assets?.filter((a) => a.asset_type === "Software").length || 0,
    Data: assets?.filter((a) => a.asset_type === "Data").length || 0,
    Service: assets?.filter((a) => a.asset_type === "Service").length || 0,
    People: assets?.filter((a) => a.asset_type === "People").length || 0,
  };

  const criticalAssets = assets?.filter((a) => a.criticality === "Critico").length || 0;

  const assetTypes = [
    { name: "Hardware", count: assetStats.Hardware, icon: Server, color: "text-primary" },
    { name: "Software", count: assetStats.Software, icon: Monitor, color: "text-blue-500" },
    { name: "Data", count: assetStats.Data, icon: Database, color: "text-purple-500" },
    { name: "Service", count: assetStats.Service, icon: Cloud, color: "text-green-500" },
    { name: "People", count: assetStats.People, icon: Users, color: "text-orange-500" },
  ];

  const handleEdit = (asset: any) => {
    setSelectedAsset(asset);
    setIsFormOpen(true);
  };

  const handleView = (asset: any) => {
    setSelectedAsset(asset);
    setIsDetailOpen(true);
  };

  const handleDelete = async () => {
    if (!assetToDelete) return;

    try {
      const { error } = await supabase
        .from("assets")
        .delete()
        .eq("id", assetToDelete.id);

      if (error) throw error;

      // Log audit event
      await logAuditEvent({
        action: 'delete',
        entityType: 'asset',
        entityId: assetToDelete.id,
        entityName: assetToDelete.name,
        oldValues: assetToDelete,
        notes: 'Asset deleted from inventory'
      });

      toast.success("Asset eliminato con successo");
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setAssetToDelete(null);
    } catch (error: any) {
      toast.error(error.message || "Errore nell'eliminazione dell'asset");
    }
  };

  const getCriticalityVariant = (criticality: string) => {
    switch (criticality) {
      case "Critico":
        return "destructive";
      case "Alto":
        return "default";
      case "Medio":
        return "secondary";
      case "Basso":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Hardware":
        return "💻";
      case "Software":
        return "📱";
      case "Data":
        return "💾";
      case "Service":
        return "☁️";
      case "People":
        return "👥";
      default:
        return "📦";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">📦 Inventario Asset</h1>
          <p className="text-muted-foreground mt-2">
            Gestisci tutti gli asset dell'organizzazione per ISO 27001
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => {
            setSelectedAsset(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Nuovo Asset
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="shadow-card col-span-1">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Totale</p>
              <p className="text-3xl font-bold text-foreground">{assets?.length || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Asset</p>
            </div>
          </CardContent>
        </Card>

        {assetTypes.map((type) => (
          <Card
            key={type.name}
            className="shadow-card transition-smooth hover:shadow-elevated cursor-pointer"
            onClick={() => setTypeFilter(type.name)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={type.color}>
                  <type.icon className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{type.name}</p>
                  <p className="text-2xl font-bold text-foreground">{type.count}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <CardTitle>Lista Asset</CardTitle>
              {filteredAssets && assets && filteredAssets.length !== assets.length && (
                <p className="text-sm text-muted-foreground">
                  Mostrati {filteredAssets.length} di {assets.length} asset
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative w-full md:w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca asset..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i tipi</SelectItem>
                  <SelectItem value="Hardware">Hardware</SelectItem>
                  <SelectItem value="Software">Software</SelectItem>
                  <SelectItem value="Data">Data</SelectItem>
                  <SelectItem value="Service">Service</SelectItem>
                  <SelectItem value="People">People</SelectItem>
                  <SelectItem value="Facility">Strutture</SelectItem>
                </SelectContent>
              </Select>
              <Select value={criticalityFilter} onValueChange={setCriticalityFilter}>
                <SelectTrigger className="w-full md:w-[140px]">
                  <SelectValue placeholder="Criticità" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte</SelectItem>
                  <SelectItem value="Critico">Critico</SelectItem>
                  <SelectItem value="Alto">Alto</SelectItem>
                  <SelectItem value="Medio">Medio</SelectItem>
                  <SelectItem value="Basso">Basso</SelectItem>
                </SelectContent>
              </Select>
              {uniqueOwners.length > 0 && (
                <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                  <SelectTrigger className="w-full md:w-[150px]">
                    <SelectValue placeholder="Owner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti gli owner</SelectItem>
                    {uniqueOwners.map(owner => (
                      <SelectItem key={owner} value={owner}>
                        {owner}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {(typeFilter !== "all" || criticalityFilter !== "all" || ownerFilter !== "all" || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTypeFilter("all");
                    setCriticalityFilter("all");
                    setOwnerFilter("all");
                    setSearchQuery("");
                  }}
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredAssets && filteredAssets.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Criticità</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.map((asset) => (
                    <TableRow key={asset.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <span className="text-2xl">{getTypeIcon(asset.asset_type)}</span>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{asset.asset_id}</TableCell>
                      <TableCell className="font-medium">{asset.name}</TableCell>
                      <TableCell>{asset.category || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={getCriticalityVariant(asset.criticality)}>
                          {asset.criticality}
                        </Badge>
                      </TableCell>
                      <TableCell>{asset.owner || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={asset.status === "Attivo" ? "default" : "secondary"}>
                          {asset.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(asset)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Dettagli
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(asset)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Modifica
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setAssetToDelete(asset)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Elimina
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || typeFilter !== "all" || criticalityFilter !== "all" || ownerFilter !== "all"
                  ? "Nessun asset trovato con i filtri selezionati"
                  : "Nessun asset registrato. Inizia aggiungendo il primo asset."}
              </p>
              {!searchQuery && typeFilter === "all" && criticalityFilter === "all" && ownerFilter === "all" && (
                <Button
                  className="mt-4"
                  onClick={() => {
                    setSelectedAsset(null);
                    setIsFormOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi Primo Asset
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AssetFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        asset={selectedAsset}
      />

      <AssetDetailDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        asset={selectedAsset}
      />

      <AlertDialog open={!!assetToDelete} onOpenChange={() => setAssetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma Eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare l'asset "{assetToDelete?.name}"? Questa azione non può
              essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
