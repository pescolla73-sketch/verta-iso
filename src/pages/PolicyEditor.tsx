import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { PolicyNavigation } from "@/components/PolicyNavigation";
import { PolicyEditor as PolicyEditorComponent } from "@/components/PolicyEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TemplateData {
  policy_name: string;
  policy_number: string;
  version: string;
  purpose: string;
  scope: string;
  policy_statement: string;
  responsibilities: string;
  iso_reference: string[];
  related_controls: string[];
  category: string;
}

export default function PolicyEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const templateData = location.state?.template as TemplateData | undefined;

  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    policy_name: templateData?.policy_name || '',
    policy_type: templateData?.category || 'custom',
    version: templateData?.version || '1.0',
    status: 'draft',
    purpose: templateData?.purpose || '',
    scope: templateData?.scope || '',
    policy_statement: templateData?.policy_statement || '',
    responsibilities: templateData?.responsibilities || '',
    iso_reference: templateData?.iso_reference || [],
    related_controls: templateData?.related_controls || []
  });

  // Update field helper
  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle creating new policy
  const handleCreatePolicy = async () => {
    if (!formData.policy_name.trim()) {
      toast.error('Inserisci un nome per la policy');
      return;
    }

    setSaving(true);
    try {
      // Get organization
      const { data: org, error: orgError } = await supabase
        .from('organization')
        .select('id, name')
        .limit(1)
        .maybeSingle();

      if (orgError || !org) {
        toast.error('Nessuna organizzazione trovata');
        return;
      }

      // Replace placeholders in content
      const replacePlaceholders = (text: string) => {
        return text
          .replace(/{{organization_name}}/g, org.name)
          .replace(/\[Nome Organizzazione\]/g, org.name);
      };

      // Create policy
      const { data: newPolicy, error } = await supabase
        .from('policies')
        .insert({
          organization_id: org.id,
          policy_name: formData.policy_name,
          policy_type: formData.policy_type,
          category: formData.policy_type,
          version: formData.version,
          status: formData.status,
          purpose: replacePlaceholders(formData.purpose),
          scope: replacePlaceholders(formData.scope),
          policy_statement: replacePlaceholders(formData.policy_statement),
          roles_responsibilities: replacePlaceholders(formData.responsibilities),
          iso_reference: formData.iso_reference,
          custom_purpose: replacePlaceholders(formData.purpose),
          custom_policy_statement: replacePlaceholders(formData.policy_statement)
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Policy creata con successo!');
      // Navigate to edit the new policy
      navigate(`/policy-editor/${newPolicy.id}`, { replace: true });
    } catch (error: any) {
      console.error('Error creating policy:', error);
      toast.error('Errore: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // If editing existing policy
  if (id && id !== 'new') {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/policies')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna alle Policy
            </Button>
          </div>

          <PolicyEditorComponent 
            policyId={id}
            onSaved={() => {
              // Stay in editor after save
            }}
          />
        </div>
      </AppLayout>
    );
  }

  // New policy form
  return (
    <AppLayout>
      <div className="space-y-6">
        <PolicyNavigation currentPage="Nuova Policy" />

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/policies')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alle Policy
          </Button>
        </div>

        {/* Template Applied Alert */}
        {templateData && (
          <Alert className="border-primary/50 bg-primary/5">
            <Sparkles className="h-4 w-4 text-primary" />
            <AlertTitle>Template Applicato</AlertTitle>
            <AlertDescription>
              Policy pre-compilata con template "{templateData.policy_name}". 
              Personalizza i campi per la tua organizzazione prima di salvare.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Crea Nuova Policy</CardTitle>
            <CardDescription>
              {templateData 
                ? 'Personalizza il template per la tua organizzazione'
                : 'Compila i campi per creare una nuova policy ISO 27001'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="policy_name">Nome Policy *</Label>
                <Input
                  id="policy_name"
                  value={formData.policy_name}
                  onChange={(e) => updateField('policy_name', e.target.value)}
                  placeholder="Es: Information Security Policy"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="policy_type">Tipo</Label>
                <Select 
                  value={formData.policy_type} 
                  onValueChange={(value) => updateField('policy_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="access">Access Control</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="version">Versione</Label>
                <Input
                  id="version"
                  value={formData.version}
                  onChange={(e) => updateField('version', e.target.value)}
                  placeholder="1.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Stato</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => updateField('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Bozza</SelectItem>
                    <SelectItem value="review">In Revisione</SelectItem>
                    <SelectItem value="approved">Approvata</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ISO References */}
            {formData.iso_reference && formData.iso_reference.length > 0 && (
              <div className="space-y-2">
                <Label>Riferimenti ISO</Label>
                <div className="flex flex-wrap gap-2">
                  {formData.iso_reference.map((ref, i) => (
                    <Badge key={i} variant="outline">ISO {ref}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Purpose */}
            <div className="space-y-2">
              <Label htmlFor="purpose">Scopo / Obiettivo *</Label>
              <Textarea
                id="purpose"
                value={formData.purpose}
                onChange={(e) => updateField('purpose', e.target.value)}
                placeholder="Descrivi lo scopo e gli obiettivi di questa policy..."
                rows={3}
              />
            </div>

            {/* Scope */}
            <div className="space-y-2">
              <Label htmlFor="scope">Ambito *</Label>
              <Textarea
                id="scope"
                value={formData.scope}
                onChange={(e) => updateField('scope', e.target.value)}
                placeholder="Definisci l'ambito di applicazione della policy..."
                rows={3}
              />
            </div>

            {/* Policy Statement */}
            <div className="space-y-2">
              <Label htmlFor="policy_statement">Contenuto Policy *</Label>
              <Textarea
                id="policy_statement"
                value={formData.policy_statement}
                onChange={(e) => updateField('policy_statement', e.target.value)}
                placeholder="Scrivi il contenuto completo della policy..."
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Tip: Il contenuto può essere pre-compilato da un template. Personalizzalo per la tua organizzazione.
              </p>
            </div>

            {/* Responsibilities */}
            <div className="space-y-2">
              <Label htmlFor="responsibilities">Responsabilità</Label>
              <Textarea
                id="responsibilities"
                value={formData.responsibilities}
                onChange={(e) => updateField('responsibilities', e.target.value)}
                placeholder="Definisci ruoli e responsabilità..."
                rows={4}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => navigate('/policies')}>
                Annulla
              </Button>
              <Button onClick={handleCreatePolicy} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creazione...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Crea Policy
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}