import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { AssetRisksSection } from "./AssetRisksSection";

interface AssetDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: any;
}

export function AssetDetailDialog({ open, onOpenChange, asset }: AssetDetailDialogProps) {
  if (!asset) return null;

  const getCriticalityColor = (criticality: string) => {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {getTypeIcon(asset.asset_type)} {asset.asset_type}
                </Badge>
                <Badge variant={getCriticalityColor(asset.criticality)}>
                  {asset.criticality}
                </Badge>
                {asset.status && (
                  <Badge variant={asset.status === "Attivo" ? "default" : "secondary"}>
                    {asset.status}
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-2xl">{asset.name}</DialogTitle>
              <p className="text-sm text-muted-foreground">{asset.asset_id}</p>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Informazioni</TabsTrigger>
            <TabsTrigger value="security">Sicurezza</TabsTrigger>
            <TabsTrigger value="risks">Rischi</TabsTrigger>
            <TabsTrigger value="technical">Dettagli Tecnici</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                    <p className="text-base">
                      {getTypeIcon(asset.asset_type)} {asset.asset_type}
                    </p>
                  </div>
                  {asset.category && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Categoria</p>
                      <p className="text-base">{asset.category}</p>
                    </div>
                  )}
                  {asset.owner && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Responsabile</p>
                      <p className="text-base">{asset.owner}</p>
                    </div>
                  )}
                  {asset.department && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Dipartimento</p>
                      <p className="text-base">{asset.department}</p>
                    </div>
                  )}
                  {asset.location && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Ubicazione</p>
                      <p className="text-base">{asset.location}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Data Creazione</p>
                    <p className="text-base">
                      {format(new Date(asset.created_at), "dd/MM/yyyy")}
                    </p>
                  </div>
                </div>
                {asset.description && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Descrizione</p>
                    <p className="text-base">{asset.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Criticità</p>
                      <Badge
                        variant={getCriticalityColor(asset.criticality)}
                        className="mt-1"
                      >
                        {asset.criticality}
                      </Badge>
                    </div>
                    {asset.confidentiality && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Confidenzialità</p>
                        <p className="text-base mt-1">{asset.confidentiality}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium text-muted-foreground mb-3">
                      Requisiti CIA
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={asset.confidentiality !== "Pubblico" ? "text-green-500" : "text-muted-foreground"}>
                          {asset.confidentiality !== "Pubblico" ? "✅" : "⚪"}
                        </span>
                        <span className="text-sm">Riservatezza (Confidentiality)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={asset.integrity_required ? "text-green-500" : "text-muted-foreground"}>
                          {asset.integrity_required ? "✅" : "⚪"}
                        </span>
                        <span className="text-sm">Integrità (Integrity)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={asset.availability_required ? "text-green-500" : "text-muted-foreground"}>
                          {asset.availability_required ? "✅" : "⚪"}
                        </span>
                        <span className="text-sm">Disponibilità (Availability)</span>
                      </div>
                    </div>
                  </div>

                  {asset.related_controls && asset.related_controls.length > 0 && (
                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Controlli ISO 27001 Associati
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {asset.related_controls.map((control: string) => (
                          <Badge key={control} variant="outline">
                            {control}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risks" className="space-y-4 mt-4">
            <AssetRisksSection 
              assetId={asset.id} 
              assetName={asset.name}
              relatedControls={asset.related_controls}
            />
          </TabsContent>

          <TabsContent value="technical" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  {asset.vendor && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Vendor/Fornitore</p>
                      <p className="text-base">{asset.vendor}</p>
                    </div>
                  )}
                  {asset.version && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Versione</p>
                      <p className="text-base">{asset.version}</p>
                    </div>
                  )}
                  {asset.purchase_date && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Data Acquisto</p>
                      <p className="text-base">
                        {format(new Date(asset.purchase_date), "dd/MM/yyyy")}
                      </p>
                    </div>
                  )}
                  {asset.warranty_expiry && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Scadenza Garanzia</p>
                      <p className="text-base">
                        {format(new Date(asset.warranty_expiry), "dd/MM/yyyy")}
                      </p>
                    </div>
                  )}
                </div>
                
                {asset.license_info && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Informazioni Licenza
                    </p>
                    <p className="text-base whitespace-pre-wrap">{asset.license_info}</p>
                  </div>
                )}
                
                {asset.notes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Note</p>
                    <p className="text-base whitespace-pre-wrap">{asset.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}