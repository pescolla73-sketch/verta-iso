import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import OrganizationForm from "@/components/OrganizationForm";
import { SetupWizard, WizardData, GeneratedDocuments } from "@/components/SetupWizard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Sparkles, FileEdit, CheckCircle, FileText, Settings } from "lucide-react";

export default function SetupAzienda() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [operationalAddressDifferent, setOperationalAddressDifferent] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDocuments | null>(null);

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
    ciso: "",
    dpo: "",
    ceo: "",
    cto: "",
    hr_manager: "",
    quality_manager: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch first organization or create one
  const { data: organization, isLoading } = useQuery({
    queryKey: ["setup-organization"],
    queryFn: async () => {
      const { data: orgs, error: fetchError } = await supabase
        .from("organization")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(1);

      if (fetchError) throw fetchError;

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

  // Check if organization is new (no ISMS scope set)
  const isNewOrganization = !organization?.isms_scope && !organization?.isms_boundaries;

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
        ciso: organization.ciso || "",
        dpo: organization.dpo || "",
        ceo: organization.ceo || "",
        cto: organization.cto || "",
        hr_manager: organization.hr_manager || "",
        quality_manager: organization.quality_manager || "",
      });
      setLogoPreview(organization.logo_url || null);
      setOperationalAddressDifferent(
        !!(organization.operational_address_street || organization.operational_address_city)
      );
    }
  }, [organization]);

  // Validation function
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!orgData.name?.trim()) newErrors.name = "Nome organizzazione è obbligatorio";
    if (!orgData.isms_scope?.trim()) newErrors.isms_scope = "Ambito ISMS è obbligatorio";
    if (!orgData.isms_boundaries?.trim()) newErrors.isms_boundaries = "Confini ISMS è obbligatorio";
    if (!orgData.ciso?.trim()) newErrors.ciso = "CISO (Responsabile ISMS) è obbligatorio";
    if (!orgData.contact_email?.trim()) newErrors.contact_email = "Email è obbligatoria";
    if (!orgData.contact_phone?.trim()) newErrors.contact_phone = "Telefono è obbligatorio";
    
    return newErrors;
  };

  // Handle wizard completion
  const handleWizardComplete = async (wizardData: WizardData, documents: GeneratedDocuments) => {
    // Save generated docs for display
    setGeneratedDocs(documents);
    
    // Update org data with wizard results
    setOrgData(prev => ({
      ...prev,
      name: wizardData.companyName || prev.name,
      sector: wizardData.industry || prev.sector,
      isms_scope: documents.scope,
      isms_boundaries: documents.context,
      scope: documents.objectives,
      legal_address_city: wizardData.locations[0] || prev.legal_address_city,
    }));
    
    // Handle multiple locations
    if (wizardData.hasMultipleSites && wizardData.locations.length > 0) {
      setOrgData(prev => ({
        ...prev,
        operational_address_city: wizardData.locations.slice(1).join(', '),
      }));
      setOperationalAddressDifferent(true);
    }

    setShowWizard(false);
    
    toast({
      title: "✅ Setup Completato!",
      description: "Documenti ISMS generati automaticamente dalle tue risposte",
    });
  };

  // Save organization mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const validationErrors = validateForm();
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        throw new Error("Compila tutti i campi obbligatori");
      }
      
      setErrors({});
      
      if (!organization?.id) {
        throw new Error("No organization found");
      }

      let logoUrl = logoPreview;

      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${organization.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('organization-logos')
          .upload(filePath, logoFile, { upsert: true });

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('organization-logos')
          .getPublicUrl(filePath);

        logoUrl = publicUrl;
      }

      const updateData = { 
        ...orgData, 
        logo_url: logoUrl,
        operational_address_street: operationalAddressDifferent ? orgData.operational_address_street : null,
        operational_address_city: operationalAddressDifferent ? orgData.operational_address_city : null,
        operational_address_zip: operationalAddressDifferent ? orgData.operational_address_zip : null,
        operational_address_province: operationalAddressDifferent ? orgData.operational_address_province : null,
        operational_address_country: operationalAddressDifferent ? orgData.operational_address_country : null,
      };

      const { data, error } = await supabase
        .from("organization")
        .update(updateData)
        .eq("id", organization.id)
        .select();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["setup-organization"] });
      setLogoFile(null);
      setErrors({});
      setGeneratedDocs(null);
      toast({ 
        title: "Dati salvati con successo",
        description: "Le informazioni dell'organizzazione sono state aggiornate"
      });
    },
    onError: (error: any) => {
      let errorMessage = "Si è verificato un errore durante il salvataggio dei dati";
      
      if (error?.message === "Compila tutti i campi obbligatori") {
        errorMessage = "Compila tutti i campi obbligatori contrassegnati con *";
      } else if (error?.message) {
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
          <h1 className="text-3xl font-bold text-foreground">🏢 Parlaci della tua azienda</h1>
          <p className="text-muted-foreground mt-2">
            Caricamento...
          </p>
        </div>
      </div>
    );
  }

  // Show wizard if user chooses it
  if (showWizard) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">🧭 Configurazione Guidata ISMS</h1>
          <p className="text-muted-foreground mt-2">
            Rispondi a poche domande per generare automaticamente i documenti ISMS
          </p>
        </div>
        
        <SetupWizard 
          onComplete={handleWizardComplete}
          onCancel={() => setShowWizard(false)}
        />
      </div>
    );
  }

  // Show choice for new organizations
  if (isNewOrganization && !orgData.isms_scope) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">🏢 Parlaci della tua azienda</h1>
          <p className="text-muted-foreground mt-2">
            È la prima volta? Scegli come vuoi configurare la tua organizzazione
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
          <Card className="border-2 border-primary/20 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setShowWizard(true)}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">✨ Configurazione Guidata</CardTitle>
                  <CardDescription>Consigliato per iniziare</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Rispondi a semplici domande
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Genera automaticamente i documenti ISMS
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  ~5 minuti per completare
                </li>
              </ul>
              <Button className="w-full mt-4" onClick={() => setShowWizard(true)}>
                <Sparkles className="h-4 w-4 mr-2" />
                Inizia la Configurazione Guidata
              </Button>
            </CardContent>
          </Card>

          <Card className="border hover:border-muted-foreground/30 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-muted">
                  <FileEdit className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">📝 Compilazione Manuale</CardTitle>
                  <CardDescription>Per utenti esperti</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  Compila direttamente tutti i campi
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  Controllo totale sui contenuti
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  Richiede conoscenza ISO 27001
                </li>
              </ul>
              <Button variant="outline" className="w-full mt-4" onClick={() => setOrgData(prev => ({ ...prev, isms_scope: ' ' }))}>
                <FileEdit className="h-4 w-4 mr-2" />
                Compila Manualmente
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">🏢 Parlaci della tua azienda</h1>
          <p className="text-muted-foreground mt-2">
            Setup e configurazione del Sistema di Gestione (ISMS)
          </p>
        </div>
        {orgData.isms_scope && (
          <Button variant="outline" onClick={() => setShowWizard(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            Rifai Wizard Guidato
          </Button>
        )}
      </div>

      {/* Alert se documenti appena generati */}
      {generatedDocs && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-900 dark:text-green-100">Documenti Generati Automaticamente!</AlertTitle>
          <AlertDescription className="text-green-800 dark:text-green-200">
            Abbiamo creato i documenti "Ambito ISMS", "Contesto" e "Obiettivi" basandoci 
            sulle tue risposte. Puoi visualizzarli e modificarli qui sotto.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs: Documenti Generati vs Form Completo */}
      <Tabs defaultValue={generatedDocs ? "documents" : "form"} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documenti Generati
          </TabsTrigger>
          <TabsTrigger value="form" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Modifica Avanzata
          </TabsTrigger>
        </TabsList>

        {/* TAB: Documenti Generati */}
        <TabsContent value="documents" className="space-y-4 mt-6">
          {/* Ambito ISMS */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    📋 Ambito ISMS
                  </CardTitle>
                  <CardDescription>
                    Definisce cosa è coperto dal tuo sistema di sicurezza
                  </CardDescription>
                </div>
                {orgData.isms_scope && orgData.isms_scope.trim() !== '' && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completato
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {orgData.isms_scope && orgData.isms_scope.trim() !== '' ? (
                <div className="bg-muted/50 p-4 rounded-lg whitespace-pre-wrap text-sm">
                  {orgData.isms_scope}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Usa il wizard per generare questo documento</p>
                  <Button variant="outline" className="mt-4" onClick={() => setShowWizard(true)}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Avvia Wizard
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contesto */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    🌍 Contesto Organizzazione
                  </CardTitle>
                  <CardDescription>
                    Fattori interni ed esterni che influenzano la sicurezza
                  </CardDescription>
                </div>
                {orgData.isms_boundaries && orgData.isms_boundaries.trim() !== '' && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completato
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {orgData.isms_boundaries && orgData.isms_boundaries.trim() !== '' ? (
                <div className="bg-muted/50 p-4 rounded-lg whitespace-pre-wrap text-sm">
                  {orgData.isms_boundaries}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Usa il wizard per generare questo documento</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Obiettivi */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    🎯 Obiettivi Sicurezza
                  </CardTitle>
                  <CardDescription>
                    Cosa vuoi ottenere con la certificazione
                  </CardDescription>
                </div>
                {orgData.scope && orgData.scope.trim() !== '' && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completato
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {orgData.scope && orgData.scope.trim() !== '' ? (
                <div className="bg-muted/50 p-4 rounded-lg whitespace-pre-wrap text-sm">
                  {orgData.scope}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Usa il wizard per generare questo documento</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info box */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-semibold">💡</span>
              <div>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Questi documenti sono stati generati automaticamente. Per modificarli, 
                  vai alla tab <strong>"Modifica Avanzata"</strong> oppure 
                  <Button variant="link" className="p-0 h-auto text-blue-600" onClick={() => setShowWizard(true)}>
                    rifai il wizard
                  </Button>.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB: Form Avanzato */}
        <TabsContent value="form" className="mt-6">
          <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <div className="flex gap-2">
              <Settings className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <div>
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">Modalità Esperto</h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                  Modifica manualmente tutti i campi dell'organizzazione. 
                  I campi contrassegnati con <span className="text-destructive font-semibold">*</span> sono obbligatori.
                </p>
              </div>
            </div>
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
            errors={errors}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}