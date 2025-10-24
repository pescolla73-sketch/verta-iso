import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import OrganizationForm from "@/components/OrganizationForm";

export default function SetupAzienda() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [operationalAddressDifferent, setOperationalAddressDifferent] = useState(false);

  const [orgData, setOrgData] = useState({
    name: "",
    sector: "",
    scope: "",
    piva: "",
    website: "",
    legal_address_street: "",
    legal_address_city: "",
    legal_address_zip: "",
    legal_address_province: "",
    legal_address_country: "Italia",
    operational_address_street: "",
    operational_address_city: "",
    operational_address_zip: "",
    operational_address_province: "",
    operational_address_country: "",
    isms_scope: "",
    isms_boundaries: "",
    contact_email: "",
    contact_phone: "",
    contact_pec: "",
  });

  // Fetch first organization or create one
  const { data: organization, isLoading } = useQuery({
    queryKey: ["setup-organization"],
    queryFn: async () => {
      // Try to get first organization
      const { data: orgs, error: fetchError } = await supabase
        .from("organization")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(1);

      if (fetchError) throw fetchError;

      // If no organization exists, create one
      if (!orgs || orgs.length === 0) {
        const { data: newOrg, error: createError } = await supabase
          .from("organization")
          .insert({ name: "Nuova Organizzazione" })
          .select()
          .single();

        if (createError) throw createError;
        return newOrg;
      }

      return orgs[0];
    },
  });

  // Load organization data into form
  useEffect(() => {
    if (organization) {
      setOrgData({
        name: organization.name || "",
        sector: organization.sector || "",
        scope: organization.scope || "",
        piva: organization.piva || "",
        website: organization.website || "",
        legal_address_street: organization.legal_address_street || "",
        legal_address_city: organization.legal_address_city || "",
        legal_address_zip: organization.legal_address_zip || "",
        legal_address_province: organization.legal_address_province || "",
        legal_address_country: organization.legal_address_country || "Italia",
        operational_address_street: organization.operational_address_street || "",
        operational_address_city: organization.operational_address_city || "",
        operational_address_zip: organization.operational_address_zip || "",
        operational_address_province: organization.operational_address_province || "",
        operational_address_country: organization.operational_address_country || "",
        isms_scope: organization.isms_scope || "",
        isms_boundaries: organization.isms_boundaries || "",
        contact_email: organization.contact_email || "",
        contact_phone: organization.contact_phone || "",
        contact_pec: organization.contact_pec || "",
      });
      setLogoPreview(organization.logo_url || null);
      setOperationalAddressDifferent(
        !!(organization.operational_address_street || organization.operational_address_city)
      );
    }
  }, [organization]);

  // Save organization mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      console.log("[SetupAzienda] Starting save mutation...");
      console.log("[SetupAzienda] Organization ID:", organization?.id);
      console.log("[SetupAzienda] Organization data to save:", orgData);
      
      if (!organization?.id) {
        console.error("[SetupAzienda] No organization ID found!");
        throw new Error("No organization found");
      }

      let logoUrl = logoPreview;

      // Upload logo if a new file was selected
      if (logoFile) {
        console.log("[SetupAzienda] Uploading logo file:", logoFile.name);
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${organization.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('organization-logos')
          .upload(filePath, logoFile, { upsert: true });

        if (uploadError) {
          console.error("[SetupAzienda] Logo upload error:", uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('organization-logos')
          .getPublicUrl(filePath);

        logoUrl = publicUrl;
        console.log("[SetupAzienda] Logo uploaded successfully:", logoUrl);
      }

      const updateData = { 
        ...orgData, 
        logo_url: logoUrl,
        // Clear operational address if not different
        operational_address_street: operationalAddressDifferent ? orgData.operational_address_street : null,
        operational_address_city: operationalAddressDifferent ? orgData.operational_address_city : null,
        operational_address_zip: operationalAddressDifferent ? orgData.operational_address_zip : null,
        operational_address_province: operationalAddressDifferent ? orgData.operational_address_province : null,
        operational_address_country: operationalAddressDifferent ? orgData.operational_address_country : null,
      };

      console.log("[SetupAzienda] Updating organization with data:", updateData);

      const { data, error } = await supabase
        .from("organization")
        .update(updateData)
        .eq("id", organization.id)
        .select();

      console.log("[SetupAzienda] Update response:", { data, error });

      if (error) {
        console.error("[SetupAzienda] Database update error:", error);
        throw error;
      }

      console.log("[SetupAzienda] Save completed successfully!");
      return data;
    },
    onSuccess: (data) => {
      console.log("[SetupAzienda] Save mutation success, data:", data);
      queryClient.invalidateQueries({ queryKey: ["setup-organization"] });
      setLogoFile(null);
      toast({ 
        title: "Dati salvati con successo",
        description: "Le informazioni dell'organizzazione sono state aggiornate"
      });
    },
    onError: (error: any) => {
      console.error("[SetupAzienda] Save mutation error:", error);
      console.error("[SetupAzienda] Error details:", {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      });
      
      let errorMessage = "Si è verificato un errore durante il salvataggio dei dati";
      
      if (error?.message) {
        errorMessage = error.message;
      }
      
      if (error?.code === "42501") {
        errorMessage = "Permessi insufficienti. Questa operazione richiede autenticazione.";
      }
      
      toast({ 
        title: "Errore nel salvataggio", 
        description: errorMessage,
        variant: "destructive" 
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Setup Azienda</h1>
          <p className="text-muted-foreground mt-2">
            Caricamento...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Setup Azienda</h1>
        <p className="text-muted-foreground mt-2">
          Configura le informazioni della tua organizzazione
        </p>
      </div>

      <OrganizationForm
        orgData={orgData}
        setOrgData={setOrgData}
        operationalAddressDifferent={operationalAddressDifferent}
        setOperationalAddressDifferent={setOperationalAddressDifferent}
        logoPreview={logoPreview}
        setLogoPreview={setLogoPreview}
        logoFile={logoFile}
        setLogoFile={setLogoFile}
        fileInputRef={fileInputRef}
        onSave={() => saveMutation.mutate()}
        isSaving={saveMutation.isPending}
      />
    </div>
  );
}
