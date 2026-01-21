import { useState, useEffect } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Lightbulb } from "lucide-react";
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
  FormDescription,
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
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
  // New ISO 27001/NIS2 fields
  brand: z.string().optional(),
  model: z.string().optional(),
  processor_ram: z.string().optional(),
  serial_number: z.string().optional(),
  asset_status: z.string().default("Attivo"),
  assigned_user_name: z.string().optional(),
  delivery_date: z.date().optional(),
  return_date: z.date().optional(),
  data_types: z.array(z.string()).default([]),
  confidentiality_level: z.number().min(1).max(5).default(1),
  integrity_level: z.number().min(1).max(5).default(1),
  availability_level: z.number().min(1).max(5).default(1),
});

type AssetFormValues = z.infer<typeof assetFormSchema>;

interface AssetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: any;
}

// Auto-suggestion input component
function AutoSuggestInput({ 
  field, 
  fieldName, 
  placeholder, 
  suggestions,
  onValueChange 
}: { 
  field: any;
  fieldName: string;
  placeholder: string;
  suggestions: string[];
  onValueChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const inputValue = field.value || "";

  const filteredSuggestions = suggestions.filter(s => 
    s.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange(e.target.value);
    setOpen(true);
  };

  const handleSelect = (suggestion: string) => {
    onValueChange(suggestion);
    setOpen(false);
  };

  return (
    <div className="relative">
      <Input
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
      />
      {filteredSuggestions.length > 0 && (
        <Lightbulb className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
      )}
      {open && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md">
          <div className="p-2">
            <p className="text-xs text-muted-foreground mb-1">Suggerimenti</p>
            {filteredSuggestions.slice(0, 5).map((suggestion) => (
              <div
                key={suggestion}
                className="px-2 py-1.5 cursor-pointer hover:bg-accent rounded text-sm"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(suggestion);
                }}
              >
                {suggestion}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// CIA Level Slider component
function CIALevelSlider({ 
  value, 
  onChange, 
  label 
}: { 
  value: number; 
  onChange: (value: number) => void;
  label: string;
}) {
  const getLevelLabel = (level: number) => {
    switch(level) {
      case 1: return { text: "Basso", color: "bg-green-500" };
      case 2: return { text: "Medio-Basso", color: "bg-lime-500" };
      case 3: return { text: "Medio", color: "bg-yellow-500" };
      case 4: return { text: "Medio-Alto", color: "bg-orange-500" };
      case 5: return { text: "Alto", color: "bg-red-500" };
      default: return { text: "N/A", color: "bg-gray-500" };
    }
  };

  const levelInfo = getLevelLabel(value);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{label}</span>
        <Badge className={cn(levelInfo.color, "text-white")}>
          {value} - {levelInfo.text}
        </Badge>
      </div>
      <Slider
        value={[value]}
        onValueChange={(vals) => onChange(vals[0])}
        min={1}
        max={5}
        step={1}
        className="w-full"
      />
    </div>
  );
}

export function AssetFormDialog({ open, onOpenChange, asset }: AssetFormDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch suggestions for auto-learning fields
  const { data: suggestions } = useQuery({
    queryKey: ["asset-suggestions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_suggestions")
        .select("field_name, field_value")
        .order("usage_count", { ascending: false });
      
      if (error) throw error;
      
      // Group by field_name
      const grouped: Record<string, string[]> = {};
      data?.forEach(s => {
        if (!grouped[s.field_name]) grouped[s.field_name] = [];
        grouped[s.field_name].push(s.field_value);
      });
      return grouped;
    },
  });

  // Fetch organization users for assignment dropdown
  const { data: orgUsers } = useQuery({
    queryKey: ["organization-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization_users")
        .select("id, user_name, user_email");
      
      if (error) {
        console.log("No organization_users table or error:", error);
        return [];
      }
      return data || [];
    },
  });

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
      // New fields
      brand: asset.brand || "",
      model: asset.model || "",
      processor_ram: asset.processor_ram || "",
      serial_number: asset.serial_number || "",
      asset_status: asset.asset_status || "Attivo",
      assigned_user_name: asset.assigned_user_name || "",
      delivery_date: asset.delivery_date ? new Date(asset.delivery_date) : undefined,
      return_date: asset.return_date ? new Date(asset.return_date) : undefined,
      data_types: asset.data_types || [],
      confidentiality_level: asset.confidentiality_level || 1,
      integrity_level: asset.integrity_level || 1,
      availability_level: asset.availability_level || 1,
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
      brand: "",
      model: "",
      processor_ram: "",
      serial_number: "",
      asset_status: "Attivo",
      assigned_user_name: "",
      data_types: [],
      confidentiality_level: 1,
      integrity_level: 1,
      availability_level: 1,
    },
  });

  // Save suggestion for auto-learning
  const saveSuggestion = async (fieldName: string, fieldValue: string, organizationId: string | null) => {
    if (!fieldValue || fieldValue.trim() === "") return;
    
    try {
      // Try to upsert - increment usage_count if exists, insert if not
      const { error } = await supabase
        .from("asset_suggestions")
        .upsert({
          organization_id: organizationId,
          field_name: fieldName,
          field_value: fieldValue.trim(),
          usage_count: 1,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'organization_id,field_name,field_value'
        });
      
      if (error) {
        console.log("Could not save suggestion:", error);
      }
    } catch (err) {
      console.log("Suggestion save error:", err);
    }
  };

  const onSubmit = async (values: AssetFormValues) => {
    setIsSubmitting(true);
    try {
      // Get organization_id
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
        // New fields
        brand: values.brand || null,
        model: values.model || null,
        processor_ram: values.processor_ram || null,
        serial_number: values.serial_number || null,
        asset_status: values.asset_status,
        assigned_user_name: values.assigned_user_name || null,
        delivery_date: values.delivery_date ? format(values.delivery_date, "yyyy-MM-dd") : null,
        return_date: values.return_date ? format(values.return_date, "yyyy-MM-dd") : null,
        data_types: values.data_types,
        confidentiality_level: values.confidentiality_level,
        integrity_level: values.integrity_level,
        availability_level: values.availability_level,
      };

      // Save auto-learning suggestions for brand, model, assigned_user_name
      await Promise.all([
        saveSuggestion("brand", values.brand || "", organizationId),
        saveSuggestion("model", values.model || "", organizationId),
        saveSuggestion("assigned_user_name", values.assigned_user_name || "", organizationId),
      ]);

      if (asset) {
        const { error } = await supabase
          .from("assets")
          .update(assetData)
          .eq("id", asset.id);

        if (error) {
          console.error("Asset update error:", error);
          throw error;
        }

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
            }
          }
        }

        toast.success("Asset creato con successo");
      }

      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["asset-suggestions"] });
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast.error(error.message || "Errore nel salvare l'asset");
    } finally {
      setIsSubmitting(false);
    }
  };

  const dataTypeOptions = [
    { value: "Personali", label: "📋 Dati Personali" },
    { value: "Sensibili", label: "🔐 Dati Sensibili/Particolari" },
    { value: "Finanziari", label: "💰 Dati Finanziari" },
    { value: "Sanitari", label: "🏥 Dati Sanitari" },
    { value: "Giudiziari", label: "⚖️ Dati Giudiziari" },
    { value: "Aziendali", label: "🏢 Dati Aziendali Riservati" },
  ];

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
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic">Info Base</TabsTrigger>
                <TabsTrigger value="technical">Dati Tecnici</TabsTrigger>
                <TabsTrigger value="traceability">Tracciabilità</TabsTrigger>
                <TabsTrigger value="security">Sicurezza</TabsTrigger>
                <TabsTrigger value="data-eval">Valutazione</TabsTrigger>
              </TabsList>

              {/* Tab 1: Info Base */}
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
                            <SelectItem value="Facility">🏢 Strutture</SelectItem>
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
                            <SelectItem value="Legal">Legal</SelectItem>
                            <SelectItem value="R&D">R&D</SelectItem>
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

              {/* Tab 2: Dati Tecnici (NEW) */}
              <TabsContent value="technical" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marca</FormLabel>
                        <FormControl>
                          <AutoSuggestInput
                            field={field}
                            fieldName="brand"
                            placeholder="es. Dell, HP, Lenovo"
                            suggestions={suggestions?.brand || []}
                            onValueChange={field.onChange}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          💡 I valori inseriti verranno suggeriti automaticamente
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modello</FormLabel>
                        <FormControl>
                          <AutoSuggestInput
                            field={field}
                            fieldName="model"
                            placeholder="es. PowerEdge R740, ThinkPad X1"
                            suggestions={suggestions?.model || []}
                            onValueChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="processor_ram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Processore / RAM</FormLabel>
                        <FormControl>
                          <Input placeholder="es. Intel Xeon 8-core, 32GB DDR4" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="serial_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numero Seriale</FormLabel>
                        <FormControl>
                          <Input placeholder="es. SN-2024-ABC123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                                {field.value ? format(field.value, "PPP") : <span>Seleziona data</span>}
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
                                {field.value ? format(field.value, "PPP") : <span>Seleziona data</span>}
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
              </TabsContent>

              {/* Tab 3: Tracciabilità (NEW) */}
              <TabsContent value="traceability" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="asset_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stato Asset</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona stato" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Attivo">✅ Attivo (in uso)</SelectItem>
                            <SelectItem value="Magazzino">📦 Magazzino</SelectItem>
                            <SelectItem value="Dismesso">❌ Dismesso</SelectItem>
                            <SelectItem value="Manutenzione">🔧 In manutenzione</SelectItem>
                            <SelectItem value="In Ordine">🛒 In Ordine</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="assigned_user_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Utente Assegnato</FormLabel>
                        <FormControl>
                          <AutoSuggestInput
                            field={field}
                            fieldName="assigned_user_name"
                            placeholder="Nome e cognome utente"
                            suggestions={[
                              ...(suggestions?.assigned_user_name || []),
                              ...(orgUsers?.map(u => u.user_name || u.user_email) || [])
                            ]}
                            onValueChange={field.onChange}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          💡 Suggerimenti dai dipendenti e inserimenti precedenti
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="delivery_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data Consegna</FormLabel>
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
                                {field.value ? format(field.value, "PPP") : <span>Seleziona data</span>}
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
                    name="return_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data Riconsegna</FormLabel>
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
                                {field.value ? format(field.value, "PPP") : <span>Seleziona data</span>}
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
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Note aggiuntive sulla tracciabilità..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Tab 4: Sicurezza */}
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
                        <FormLabel>Classificazione</FormLabel>
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

              {/* Tab 5: Valutazione del Dato (NEW) */}
              <TabsContent value="data-eval" className="space-y-4 mt-4">
                <div className="border rounded-lg p-4 space-y-4">
                  <div>
                    <FormLabel className="text-base font-semibold">Tipi di Dati Trattati</FormLabel>
                    <p className="text-sm text-muted-foreground mb-3">
                      Seleziona i tipi di dati gestiti da questo asset (GDPR / NIS2)
                    </p>
                    <FormField
                      control={form.control}
                      name="data_types"
                      render={({ field }) => (
                        <FormItem>
                          <div className="grid grid-cols-2 gap-2">
                            {dataTypeOptions.map((option) => (
                              <div
                                key={option.value}
                                className={cn(
                                  "flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors",
                                  field.value.includes(option.value)
                                    ? "bg-primary/10 border-primary"
                                    : "hover:bg-muted"
                                )}
                                onClick={() => {
                                  const newValue = field.value.includes(option.value)
                                    ? field.value.filter((v: string) => v !== option.value)
                                    : [...field.value, option.value];
                                  field.onChange(newValue);
                                }}
                              >
                                <Checkbox
                                  checked={field.value.includes(option.value)}
                                  onCheckedChange={() => {}}
                                />
                                <span className="text-sm">{option.label}</span>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="border rounded-lg p-4 space-y-6">
                  <div>
                    <FormLabel className="text-base font-semibold">Valutazione CIA Dettagliata</FormLabel>
                    <p className="text-sm text-muted-foreground mb-4">
                      Livello di criticità per Riservatezza, Integrità e Disponibilità (1-5)
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="confidentiality_level"
                    render={({ field }) => (
                      <CIALevelSlider
                        value={field.value}
                        onChange={field.onChange}
                        label="🔒 Riservatezza (Confidentiality)"
                      />
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="integrity_level"
                    render={({ field }) => (
                      <CIALevelSlider
                        value={field.value}
                        onChange={field.onChange}
                        label="✔️ Integrità (Integrity)"
                      />
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="availability_level"
                    render={({ field }) => (
                      <CIALevelSlider
                        value={field.value}
                        onChange={field.onChange}
                        label="⏰ Disponibilità (Availability)"
                      />
                    )}
                  />

                  <div className="bg-muted/50 rounded-lg p-3 mt-4">
                    <p className="text-sm text-muted-foreground">
                      <strong>Punteggio CIA complessivo:</strong>{" "}
                      {form.watch("confidentiality_level") + form.watch("integrity_level") + form.watch("availability_level")} / 15
                    </p>
                  </div>
                </div>
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
