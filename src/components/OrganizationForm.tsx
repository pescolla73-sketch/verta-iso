import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X } from "lucide-react";

interface OrganizationFormProps {
  orgData: any;
  setOrgData: (data: any) => void;
  operationalAddressDifferent: boolean;
  setOperationalAddressDifferent: (value: boolean) => void;
  logoPreview: string | null;
  setLogoPreview: (value: string | null) => void;
  logoFile: File | null;
  setLogoFile: (file: File | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onSave: () => void;
  isSaving: boolean;
}

export default function OrganizationForm({
  orgData,
  setOrgData,
  operationalAddressDifferent,
  setOperationalAddressDifferent,
  logoPreview,
  setLogoPreview,
  logoFile,
  setLogoFile,
  fileInputRef,
  onSave,
  isSaving,
}: OrganizationFormProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Informazioni Base</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Organizzazione</Label>
              <Input
                id="name"
                value={orgData.name}
                onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sector">Settore/Industry</Label>
              <Input
                id="sector"
                placeholder="es. Tecnologia, Sanità, Finanza"
                value={orgData.sector}
                onChange={(e) => setOrgData({ ...orgData, sector: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="piva">P.IVA / Codice Fiscale</Label>
              <Input
                id="piva"
                value={orgData.piva}
                onChange={(e) => setOrgData({ ...orgData, piva: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Sito Web</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://esempio.it"
                value={orgData.website}
                onChange={(e) => setOrgData({ ...orgData, website: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Logo Aziendale</Label>
            <div className="flex items-center gap-4">
              {logoPreview && (
                <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-muted">
                  <img 
                    src={logoPreview} 
                    alt="Logo preview" 
                    className="w-full h-full object-contain"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => {
                      setLogoPreview(null);
                      setLogoFile(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setLogoFile(file);
                      const reader = new FileReader();
                      reader.onload = () => {
                        setLogoPreview(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {logoPreview ? "Cambia logo" : "Carica logo"}
                </Button>
                <p className="text-sm text-muted-foreground mt-1">
                  PNG, JPG o SVG (max 5MB)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sede Legale</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="legal_address_street">Indirizzo</Label>
              <Input
                id="legal_address_street"
                value={orgData.legal_address_street}
                onChange={(e) => setOrgData({ ...orgData, legal_address_street: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="legal_address_city">Città</Label>
              <Input
                id="legal_address_city"
                value={orgData.legal_address_city}
                onChange={(e) => setOrgData({ ...orgData, legal_address_city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="legal_address_zip">CAP</Label>
              <Input
                id="legal_address_zip"
                value={orgData.legal_address_zip}
                onChange={(e) => setOrgData({ ...orgData, legal_address_zip: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="legal_address_province">Provincia</Label>
              <Input
                id="legal_address_province"
                value={orgData.legal_address_province}
                onChange={(e) => setOrgData({ ...orgData, legal_address_province: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="legal_address_country">Paese</Label>
              <Input
                id="legal_address_country"
                value={orgData.legal_address_country}
                onChange={(e) => setOrgData({ ...orgData, legal_address_country: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sede Operativa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="operational_different"
              checked={operationalAddressDifferent}
              onChange={(e) => setOperationalAddressDifferent(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="operational_different">Diversa da sede legale</Label>
          </div>
          {operationalAddressDifferent && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="operational_address_street">Indirizzo</Label>
                <Input
                  id="operational_address_street"
                  value={orgData.operational_address_street}
                  onChange={(e) => setOrgData({ ...orgData, operational_address_street: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="operational_address_city">Città</Label>
                <Input
                  id="operational_address_city"
                  value={orgData.operational_address_city}
                  onChange={(e) => setOrgData({ ...orgData, operational_address_city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="operational_address_zip">CAP</Label>
                <Input
                  id="operational_address_zip"
                  value={orgData.operational_address_zip}
                  onChange={(e) => setOrgData({ ...orgData, operational_address_zip: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="operational_address_province">Provincia</Label>
                <Input
                  id="operational_address_province"
                  value={orgData.operational_address_province}
                  onChange={(e) => setOrgData({ ...orgData, operational_address_province: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="operational_address_country">Paese</Label>
                <Input
                  id="operational_address_country"
                  value={orgData.operational_address_country}
                  onChange={(e) => setOrgData({ ...orgData, operational_address_country: e.target.value })}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scope ISMS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="isms_scope">Ambito ISMS</Label>
            <Textarea
              id="isms_scope"
              value={orgData.isms_scope}
              onChange={(e) => setOrgData({ ...orgData, isms_scope: e.target.value })}
              rows={4}
              placeholder="Descrivere l'ambito del Sistema di Gestione della Sicurezza delle Informazioni"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="isms_boundaries">Confini ISMS</Label>
            <Textarea
              id="isms_boundaries"
              value={orgData.isms_boundaries}
              onChange={(e) => setOrgData({ ...orgData, isms_boundaries: e.target.value })}
              rows={4}
              placeholder="Definire i confini del sistema ISMS (es. processi, sedi, sistemi inclusi/esclusi)"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contatti</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact_email">Email</Label>
              <Input
                id="contact_email"
                type="email"
                placeholder="info@esempio.it"
                value={orgData.contact_email}
                onChange={(e) => setOrgData({ ...orgData, contact_email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Telefono</Label>
              <Input
                id="contact_phone"
                type="tel"
                placeholder="+39 02 1234567"
                value={orgData.contact_phone}
                onChange={(e) => setOrgData({ ...orgData, contact_phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_pec">PEC (opzionale)</Label>
              <Input
                id="contact_pec"
                type="email"
                placeholder="pec@pec.esempio.it"
                value={orgData.contact_pec}
                onChange={(e) => setOrgData({ ...orgData, contact_pec: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={onSave}
        disabled={isSaving}
        size="lg"
        className="w-full"
      >
        Salva
      </Button>
    </div>
  );
}
