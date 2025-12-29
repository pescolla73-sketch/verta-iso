import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logAuditEvent } from "@/utils/auditLog";
import { generateRisksFromCriticalAsset } from "@/utils/assetRiskGenerator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const assetFormSchema = z.object({
  asset_id: z.string().min(1, "Asset ID obbligatorio"),
  name: z.string().min(1, "Nome obbligatorio"),
  description: z.string().optional(),
  asset_type: z.string().min(1, "Tipo obbligatorio"),
  category: z.string().optional(),
  criticality: z.string().min(1, "Criticità obbligatoria"),
  confidentiality: z.string().optional(),
  integrity_required: z.boolean().default(true),
  availability_required: z.boolean().default(true),
  owner: z.string().optional(),
  department: z.string().optional(),
  location: z.string().optional(),
  vendor: z.string().optional(),
  version: z.string().optional(),
  license_info: z.string().optional(),
  purchase_date: z.date().optional(),
  warranty_expiry: z.date().optional(),
  status: z.string().default("Attivo"),
  notes: z.string().optional(),
});

type AssetFormValues = z.infer<typeof assetFormSchema>;

interface AssetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: any;
}

export function AssetFormDialog({ open, onOpenChange, asset }: AssetFormDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: asset ? {
      asset_id: asset.asset_id,
      name: asset.name,
      description: asset.description || "",
      asset_type: asset.asset_type,
      category: asset.category || "",
      criticality: asset.criticality,
      confidentiality: asset.confidentiality || "Interno",
      integrity_required: asset.integrity_required ?? true,
      availability_required: asset.availability_required ?? true,
      owner: asset.owner || "",
      department: asset.department || "",
      location: asset.location || "",
      vendor: asset.vendor || "",
      version: asset.version || "",
      license_info: asset.license_info || "",
      purchase_date: asset.purchase_date ? new Date(asset.purchase_date) : undefined,
      warranty_expiry: asset.warranty_expiry ? new Date(asset.warranty_expiry) : undefined,
      status: asset.status || "Attivo",
      notes: asset.notes || "",
    } : {
      asset_id: "",
      name: "",
      description: "",
      asset_type: "",
      category: "",
      criticality: "Medio",
      confidentiality: "Interno",
      integrity_required: true,
      availability_required: true,
      owner: "",
      department: "",
      location: "",
      vendor: "",
      version: "",
      license_info: "",
      status: "Attivo",
      notes: "",
    },
  });

  const onSubmit = async (values: AssetFormValues) => {
    setIsSubmitting(true);
    try {
      // Get organization_id (first organization or null for demo)
      let organizationId = null;
      try {
        const { data: orgs } = await supabase
          .from("organization")
          .select("id")
          .limit(1)
          .single();
        
        if (orgs) {
          organizationId = orgs.id;
        }
      } catch (err) {
        console.log("No organization found, creating asset without org reference");
      }

      const assetData = {
        asset_id: values.asset_id,
        name: values.name,
        description: values.description || null,
        asset_type: values.asset_type,
        category: values.category || null,
        criticality: values.criticality,
        confidentiality: values.confidentiality || null,
        integrity_required: values.integrity_required,
        availability_required: values.availability_required,
        owner: values.owner || null,
        department: values.department || null,
        location: values.location || null,
        vendor: values.vendor || null,
        version: values.version || null,
        license_info: values.license_info || null,
        purchase_date: values.purchase_date ? format(values.purchase_date, "yyyy-MM-dd") : null,
        warranty_expiry: values.warranty_expiry ? format(values.warranty_expiry, "yyyy-MM-dd") : null,
        status: values.status,
        notes: values.notes || null,
        organization_id: organizationId,
      };

      console.log("Creating/updating asset with data:", assetData);

      if (asset) {
        const { error } = await supabase
          .from("assets")
          .update(assetData)
          .eq("id", asset.id);

        if (error) {
          console.error("Asset update error:", error);
          throw error;
        }

        // Log audit event for update
        await logAuditEvent({
          action: 'update',
          entityType: 'asset',
          entityId: asset.id,
          entityName: values.name,
          oldValues: asset,
          newValues: assetData,
          notes: 'Asset updated'
        });

        toast.success("Asset aggiornato con successo");
      } else {
        const { data: newAsset, error } = await supabase
          .from("assets")
          .insert([assetData])
          .select()
          .single();

        if (error) {
          console.error("Asset creation error:", error);
          throw error;
        }

        // Log audit event for create
        if (newAsset) {
          await logAuditEvent({
            action: 'create',
            entityType: 'asset',
            entityId: newAsset.id,
            entityName: values.name,
            newValues: assetData,
            notes: 'New asset created'
          });

          // Generate risks for critical assets
          const isCritical = values.criticality === 'Critico' || values.criticality === 'Alto';
          if (isCritical) {
            try {
              const risksGenerated = await generateRisksFromCriticalAsset({
                id: newAsset.id,
                name: values.name,
                asset_type: values.asset_type,
                criticality: values.criticality,
                confidentiality: values.confidentiality || null,
                integrity_required: values.integrity_required,
                availability_required: values.availability_required,
                organization_id: organizationId,
              });
              
              if (risksGenerated > 0) {
                toast.info(`Asset critico rilevato: generati ${risksGenerated} rischi automaticamente`, {
                  duration: 7000,
                  description: 'Vai al Risk Assessment per visualizzarli'
                });
              }
            } catch (riskError) {
              console.error('Error generating risks:', riskError);
              // Don't fail the asset creation if risk generation fails
            }
          }
        }

        toast.success("Asset creato con successo");
      }

      queryClient.invalidateQueries({ queryKey: ["assets"] });
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast.error(error.message || "Errore nel salvare l'asset");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {asset ? "✏️ Modifica Asset" : "➕ Nuovo Asset"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Info Base</TabsTrigger>
                <TabsTrigger value="security">Sicurezza</TabsTrigger>
                <TabsTrigger value="technical">Dettagli Tecnici</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="asset_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Asset *</FormLabel>
                        <FormControl>
                          <Input placeholder="es. HW-001, SW-012" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Asset *</FormLabel>
                        <FormControl>
                          <Input placeholder="es. Server Produzione" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="asset_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Hardware">💻 Hardware</SelectItem>
                            <SelectItem value="Software">📱 Software</SelectItem>
                            <SelectItem value="Data">💾 Data/Informazioni</SelectItem>
                            <SelectItem value="Service">☁️ Servizio</SelectItem>
                            <SelectItem value="People">👥 Persone</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <FormControl>
                          <Input placeholder="es. Server, Laptop, Database" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="owner"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner/Responsabile</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome responsabile" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dipartimento</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona dipartimento" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="IT">IT</SelectItem>
                            <SelectItem value="HR">HR</SelectItem>
                            <SelectItem value="Finance">Finance</SelectItem>
                            <SelectItem value="Operations">Operations</SelectItem>
                            <SelectItem value="Sales">Sales</SelectItem>
                            <SelectItem value="Marketing">Marketing</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ubicazione</FormLabel>
                        <FormControl>
                          <Input placeholder="es. Ufficio Roma, AWS eu-west-1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrizione</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descrizione dettagliata dell'asset..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="security" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="criticality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Criticità *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona criticità" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Critico">🔴 Critico</SelectItem>
                            <SelectItem value="Alto">🟠 Alto</SelectItem>
                            <SelectItem value="Medio">🟡 Medio</SelectItem>
                            <SelectItem value="Basso">🟢 Basso</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confidentiality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confidenzialità</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona livello" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Pubblico">Pubblico</SelectItem>
                            <SelectItem value="Interno">Interno</SelectItem>
                            <SelectItem value="Confidenziale">Confidenziale</SelectItem>
                            <SelectItem value="Segreto">Segreto</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-3 border rounded-lg p-4">
                  <p className="text-sm font-medium">Requisiti CIA (Confidentiality, Integrity, Availability)</p>
                  
                  <FormField
                    control={form.control}
                    name="integrity_required"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Integrità (Integrity) richiesta
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="availability_required"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Disponibilità (Availability) richiesta
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="technical" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="vendor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vendor/Fornitore</FormLabel>
                        <FormControl>
                          <Input placeholder="es. Dell, Microsoft, AWS" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="version"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Versione</FormLabel>
                        <FormControl>
                          <Input placeholder="es. v2.3.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="purchase_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data Acquisto</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Seleziona data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="warranty_expiry"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Scadenza Garanzia</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Seleziona data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Attivo">✅ Attivo</SelectItem>
                            <SelectItem value="Dismesso">❌ Dismesso</SelectItem>
                            <SelectItem value="Manutenzione">🔧 In manutenzione</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="license_info"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Informazioni Licenza</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Dettagli licenza, chiavi, scadenze..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Note aggiuntive..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annulla
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvataggio..." : "💾 Salva Asset"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}