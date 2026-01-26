import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Lightbulb, AlertTriangle, Check, ChevronsUpDown, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logAuditEvent } from "@/utils/auditLog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { generateRisksFromCriticalAsset } from "@/utils/assetRiskGenerator";
import { useOrganization } from "@/hooks/useOrganization";
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
  delivery_notes: z.string().optional(), // NEW: Delivery notes
  data_types: z.array(z.string()).default([]),
  confidentiality_level: z.number().min(1).max(5).default(1),
  integrity_level: z.number().min(1).max(5).default(1),
  availability_level: z.number().min(1).max(5).default(1),
  // New security fields
  operating_system: z.string().optional(),
  antivirus_installed: z.boolean().default(false),
  antivirus_name: z.string().optional(),
  backup_enabled: z.boolean().default(false),
  backup_software: z.string().optional(),
  update_mode: z.string().default("Manuale"),
});

type AssetFormValues = z.infer<typeof assetFormSchema>;

interface AssetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: any;
}

// Enhanced Combobox component with free-text input
function AutoCombobox({ 
  value, 
  onValueChange, 
  suggestions = [],
  placeholder = "Seleziona o digita...",
  emptyText = "Nessun suggerimento",
  disabled = false
}: { 
  value: string;
  onValueChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");

  // Update inputValue when external value changes
  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  // Filter suggestions based on input
  const filteredSuggestions = useMemo(() => {
    if (!inputValue) return suggestions;
    return suggestions.filter((s) =>
      s.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [inputValue, suggestions]);

  // Check if the current input is already in suggestions
  const isNewValue = inputValue.trim() !== "" && 
    !suggestions.some((s) => s.toLowerCase() === inputValue.toLowerCase().trim());

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
    setInputValue(selectedValue);
    setOpen(false);
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
  };

  const handleInputBlur = () => {
    // Commit the typed value when blurring
    if (inputValue.trim() !== "" && inputValue.trim() !== value) {
      onValueChange(inputValue.trim());
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          <span className={cn(!value && "text-muted-foreground")}>
            {value || placeholder}
          </span>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            {suggestions.length > 0 && (
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={inputValue}
            onValueChange={handleInputChange}
            onBlur={handleInputBlur}
          />
          <CommandList>
            {filteredSuggestions.length === 0 && !isNewValue && (
              <CommandEmpty>{emptyText}</CommandEmpty>
            )}
            
            {/* Option to add new value */}
            {isNewValue && (
              <CommandGroup heading="Nuovo valore">
                <CommandItem
                  value={inputValue}
                  onSelect={() => handleSelect(inputValue.trim())}
                  className="text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Aggiungi "{inputValue.trim()}"
                </CommandItem>
              </CommandGroup>
            )}
            
            {/* Existing suggestions */}
            {filteredSuggestions.length > 0 && (
              <CommandGroup heading="Suggerimenti">
                {filteredSuggestions.slice(0, 10).map((suggestion) => (
                  <CommandItem
                    key={suggestion}
                    value={suggestion}
                    onSelect={() => handleSelect(suggestion)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === suggestion ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <Lightbulb className="mr-2 h-3.5 w-3.5 text-amber-500" />
                    {suggestion}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Legacy wrapper for compatibility
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
  return (
    <AutoCombobox
      value={field.value || ""}
      onValueChange={onValueChange}
      suggestions={suggestions}
      placeholder={placeholder}
    />
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

// Security Risk Alert Component (Intelligence Alert)
function SecurityRiskAlert({ 
  operatingSystem, 
  antivirusInstalled, 
  backupEnabled 
}: { 
  operatingSystem?: string; 
  antivirusInstalled: boolean; 
  backupEnabled: boolean; 
}) {
  const obsoleteOS = ["Windows 7", "Windows XP", "Windows Vista", "Windows 8"];
  const isObsoleteOS = obsoleteOS.some(os => operatingSystem?.toLowerCase().includes(os.toLowerCase()));
  
  const risks: string[] = [];
  if (isObsoleteOS) risks.push("Sistema Operativo obsoleto");
  if (!antivirusInstalled) risks.push("Nessun Antivirus/EDR");
  if (!backupEnabled) risks.push("Backup non attivo");
  
  if (risks.length === 0) return null;
  
  return (
    <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800 dark:text-amber-200">
        <strong>⚠️ Attenzione:</strong> Questa configurazione aumenta il rischio Ransomware.
        <ul className="list-disc ml-4 mt-1 text-sm">
          {risks.map(risk => <li key={risk}>{risk}</li>)}
        </ul>
        <p className="text-xs mt-2 text-amber-700 dark:text-amber-300">
          Verrà suggerita una probabilità di minaccia più alta nel Risk Assessment.
        </p>
      </AlertDescription>
    </Alert>
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

  const getDefaultValues = useCallback((assetData?: any): AssetFormValues => {
    if (assetData) {
      return {
        asset_id: assetData.asset_id || "",
        name: assetData.name || "",
        description: assetData.description || "",
        asset_type: assetData.asset_type || "",
        category: assetData.category || "",
        criticality: assetData.criticality || "Medio",
        confidentiality: assetData.confidentiality || "Interno",
        integrity_required: assetData.integrity_required ?? true,
        availability_required: assetData.availability_required ?? true,
        owner: assetData.owner || "",
        department: assetData.department || "",
        location: assetData.location || "",
        vendor: assetData.vendor || "",
        version: assetData.version || "",
        license_info: assetData.license_info || "",
        purchase_date: assetData.purchase_date ? new Date(assetData.purchase_date) : undefined,
        warranty_expiry: assetData.warranty_expiry ? new Date(assetData.warranty_expiry) : undefined,
        status: assetData.status || "Attivo",
        notes: assetData.notes || "",
        brand: assetData.brand || "",
        model: assetData.model || "",
        processor_ram: assetData.processor_ram || "",
        serial_number: assetData.serial_number || "",
        asset_status: assetData.asset_status || "Attivo",
        assigned_user_name: assetData.assigned_user_name || "",
        delivery_date: assetData.delivery_date ? new Date(assetData.delivery_date) : undefined,
        return_date: assetData.return_date ? new Date(assetData.return_date) : undefined,
        delivery_notes: assetData.delivery_notes || "", // NEW
        data_types: assetData.data_types || [],
        confidentiality_level: assetData.confidentiality_level ?? 1,
        integrity_level: assetData.integrity_level ?? 1,
        availability_level: assetData.availability_level ?? 1,
        // New security fields
        operating_system: assetData.operating_system || "",
        antivirus_installed: assetData.antivirus_installed ?? false,
        antivirus_name: assetData.antivirus_name || "",
        backup_enabled: assetData.backup_enabled ?? false,
        backup_software: assetData.backup_software || "",
        update_mode: assetData.update_mode || "Manuale",
      };
    }
    return {
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
      delivery_notes: "", // NEW
      data_types: [],
      confidentiality_level: 1,
      integrity_level: 1,
      availability_level: 1,
      // New security fields
      operating_system: "",
      antivirus_installed: false,
      antivirus_name: "",
      backup_enabled: false,
      backup_software: "",
      update_mode: "Manuale",
    };
  }, []);

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: getDefaultValues(asset),
    mode: "onChange",
  });

  // Reset form when dialog opens or asset changes
  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(asset));
    }
  }, [open, asset, form, getDefaultValues]);

  // Use stable watch for CIA score calculation (prevents infinite re-renders)
  const watchedConfidentialityLevel = useWatch({ control: form.control, name: "confidentiality_level" });
  const watchedIntegrityLevel = useWatch({ control: form.control, name: "integrity_level" });
  const watchedAvailabilityLevel = useWatch({ control: form.control, name: "availability_level" });

  const ciaScore = useMemo(() => {
    return (watchedConfidentialityLevel ?? 1) + (watchedIntegrityLevel ?? 1) + (watchedAvailabilityLevel ?? 1);
  }, [watchedConfidentialityLevel, watchedIntegrityLevel, watchedAvailabilityLevel]);

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

  // Use the organization hook for proper demo mode support
  const { organizationId: orgId, isDemoMode } = useOrganization();

  const onSubmit = async (values: AssetFormValues) => {
    setIsSubmitting(true);
    try {
      // Use the organization ID from the hook (handles demo mode automatically)
      const organizationId = orgId;

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
        delivery_notes: values.delivery_notes || null, // NEW
        data_types: values.data_types,
        confidentiality_level: values.confidentiality_level,
        integrity_level: values.integrity_level,
        availability_level: values.availability_level,
        // New security fields
        operating_system: values.operating_system || null,
        antivirus_installed: values.antivirus_installed,
        antivirus_name: values.antivirus_name || null,
        backup_enabled: values.backup_enabled,
        backup_software: values.backup_software || null,
        update_mode: values.update_mode || "Manuale",
      };

      // Save auto-learning suggestions for brand, model, assigned_user_name, operating_system, antivirus_name
      await Promise.all([
        saveSuggestion("brand", values.brand || "", organizationId),
        saveSuggestion("model", values.model || "", organizationId),
        saveSuggestion("assigned_user_name", values.assigned_user_name || "", organizationId),
        saveSuggestion("operating_system", values.operating_system || "", organizationId),
        saveSuggestion("antivirus_name", values.antivirus_name || "", organizationId),
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
                        <Select onValueChange={field.onChange} value={field.value || ""}>
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
                        <Select onValueChange={field.onChange} value={field.value || ""}>
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

                {/* Security fields section */}
                <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    🛡️ Sicurezza Endpoint
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="operating_system"
                      render={({ field }) => {
                        const obsoleteOS = ["Windows 7", "Windows XP", "Windows Vista", "Windows 8"];
                        const isObsolete = obsoleteOS.some(os => field.value?.toLowerCase().includes(os.toLowerCase()));
                        
                        // Combine predefined OS with custom suggestions from database
                        const predefinedOS = [
                          "Windows 11", "Windows 10", "Windows Server 2022", "Windows Server 2019",
                          "macOS Sonoma", "macOS Ventura", "Ubuntu 24.04", "Ubuntu 22.04",
                          "Debian 12", "RHEL 9", "CentOS Stream 9", "iOS", "Android",
                          "Windows 7", "Windows 8"
                        ];
                        const customOS = (suggestions?.operating_system || []).filter(
                          os => !predefinedOS.includes(os)
                        );
                        const allOSOptions = [...predefinedOS, ...customOS];
                        
                        return (
                          <FormItem className="col-span-2">
                            <FormLabel>Sistema Operativo</FormLabel>
                            <FormControl>
                              <AutoCombobox
                                value={field.value || ""}
                                onValueChange={field.onChange}
                                suggestions={allOSOptions}
                                placeholder="Seleziona o digita SO..."
                              />
                            </FormControl>
                            {isObsolete && (
                              <Alert variant="destructive" className="mt-2">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                  ⚠️ Sistema Operativo obsoleto! Rischio sicurezza elevato.
                                </AlertDescription>
                              </Alert>
                            )}
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />

                    <FormField
                      control={form.control}
                      name="antivirus_installed"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-3 border rounded-lg">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Antivirus/EDR Installato</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="antivirus_name"
                      render={({ field }) => {
                        // Combine predefined AV with custom suggestions
                        const predefinedAV = [
                          "Microsoft Defender", "CrowdStrike Falcon", "SentinelOne", 
                          "Carbon Black", "Symantec", "McAfee", "Bitdefender",
                          "Kaspersky", "ESET", "Sophos", "Trend Micro"
                        ];
                        const customAV = (suggestions?.antivirus_name || []).filter(
                          av => !predefinedAV.includes(av)
                        );
                        const allAVOptions = [...predefinedAV, ...customAV];
                        
                        return (
                          <FormItem>
                            <FormLabel>Software Antivirus/EDR</FormLabel>
                            <FormControl>
                              <AutoCombobox
                                value={field.value || ""}
                                onValueChange={field.onChange}
                                suggestions={allAVOptions}
                                placeholder="Seleziona o digita antivirus..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />

                    <FormField
                      control={form.control}
                      name="backup_enabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-3 border rounded-lg">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Backup Attivo</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="backup_software"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Software di Backup</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleziona software backup" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Veeam">Veeam</SelectItem>
                              <SelectItem value="Acronis">Acronis</SelectItem>
                              <SelectItem value="Commvault">Commvault</SelectItem>
                              <SelectItem value="Veritas">Veritas NetBackup</SelectItem>
                              <SelectItem value="AWS Backup">AWS Backup</SelectItem>
                              <SelectItem value="Azure Backup">Azure Backup</SelectItem>
                              <SelectItem value="Google Backup">Google Cloud Backup</SelectItem>
                              <SelectItem value="Time Machine">Time Machine (macOS)</SelectItem>
                              <SelectItem value="Windows Backup">Windows Backup</SelectItem>
                              <SelectItem value="Bacula">Bacula</SelectItem>
                              <SelectItem value="Altro">Altro</SelectItem>
                              <SelectItem value="Nessuno">Nessuno</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="update_mode"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Modalità Aggiornamenti</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "Manuale"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleziona modalità" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Automatico">✅ Automatico (consigliato)</SelectItem>
                              <SelectItem value="Manuale">⚠️ Manuale</SelectItem>
                              <SelectItem value="WSUS">WSUS/Managed</SelectItem>
                              <SelectItem value="MDM">MDM (Mobile Device Management)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* INTELLIGENCE ALERT for risky configurations */}
                  <SecurityRiskAlert 
                    operatingSystem={form.watch("operating_system")} 
                    antivirusInstalled={form.watch("antivirus_installed")}
                    backupEnabled={form.watch("backup_enabled")}
                  />
                </div>
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
                        <Select onValueChange={field.onChange} value={field.value || "Attivo"}>
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
                  name="delivery_notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>📝 Note di Consegna</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Note sulla consegna, condizioni dell'asset, accessori inclusi..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Registra chi ha consegnato l'asset, condizioni, accessori e note importanti
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Quick Decommission Button */}
                {asset && (
                  <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
                    <h4 className="font-semibold text-sm">⚡ Azioni Rapide</h4>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          form.setValue("asset_status", "Dismesso");
                          form.setValue("return_date", new Date());
                          toast.info("Asset segnato come dismesso. Ricorda di salvare.");
                        }}
                      >
                        ❌ Segna come Dismesso
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          form.setValue("asset_status", "Magazzino");
                          form.setValue("return_date", new Date());
                          toast.info("Asset rimesso in magazzino. Ricorda di salvare.");
                        }}
                      >
                        📦 Rimetti in Magazzino
                      </Button>
                    </div>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note Generali</FormLabel>
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
                        <Select onValueChange={field.onChange} value={field.value || "Medio"}>
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
                        <Select onValueChange={field.onChange} value={field.value || "Interno"}>
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
                      render={({ field }) => {
                        // Stable reference to prevent infinite loops
                        const currentDataTypes: string[] = Array.isArray(field.value) ? field.value : [];
                        
                        const handleToggle = (optionValue: string) => {
                          const isSelected = currentDataTypes.includes(optionValue);
                          const newValue = isSelected
                            ? currentDataTypes.filter((v) => v !== optionValue)
                            : [...currentDataTypes, optionValue];
                          field.onChange(newValue);
                        };
                        
                        return (
                          <FormItem>
                            <div className="grid grid-cols-2 gap-2">
                              {dataTypeOptions.map((option) => {
                                const isSelected = currentDataTypes.includes(option.value);
                                return (
                                  <button
                                    type="button"
                                    key={option.value}
                                    className={cn(
                                      "flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors text-left",
                                      isSelected
                                        ? "bg-primary/10 border-primary"
                                        : "hover:bg-muted"
                                    )}
                                    onClick={() => handleToggle(option.value)}
                                  >
                                    <div 
                                      className={cn(
                                        "h-4 w-4 rounded border flex items-center justify-center flex-shrink-0",
                                        isSelected ? "bg-primary border-primary" : "border-muted-foreground"
                                      )}
                                    >
                                      {isSelected && (
                                        <svg 
                                          className="h-3 w-3 text-primary-foreground" 
                                          fill="none" 
                                          viewBox="0 0 24 24" 
                                          stroke="currentColor"
                                        >
                                          <path 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            strokeWidth={3} 
                                            d="M5 13l4 4L19 7" 
                                          />
                                        </svg>
                                      )}
                                    </div>
                                    <span className="text-sm">{option.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
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
                        value={field.value ?? 1}
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
                        value={field.value ?? 1}
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
                        value={field.value ?? 1}
                        onChange={field.onChange}
                        label="⏰ Disponibilità (Availability)"
                      />
                    )}
                  />

                  <div className="bg-muted/50 rounded-lg p-3 mt-4">
                    <p className="text-sm text-muted-foreground">
                      <strong>Punteggio CIA complessivo:</strong>{" "}
                      {ciaScore} / 15
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
