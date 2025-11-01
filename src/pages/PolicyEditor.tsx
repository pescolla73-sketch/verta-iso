import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Save, 
  FileText, 
  ArrowLeft,
  CheckCircle, 
  Clock,
  Edit3,
  Archive
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PolicyNavigation } from "@/components/PolicyNavigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PolicyEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [policy, setPolicy] = useState<any>(null);

  useEffect(() => {
    console.log('🔍 PolicyEditor mounted, ID:', id);
    if (id && id !== 'new') {
      loadPolicy();
    } else {
      setLoading(false);
    }
  }, [id]);

  const loadPolicy = async () => {
    try {
      console.log('📥 Loading policy:', id);
      setLoading(true);
      
      const { data, error } = await supabase
        .from('policies')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ Error loading policy:', error);
        toast.error('Errore nel caricamento della policy');
        throw error;
      }

      console.log('✅ Policy loaded:', data);
      setPolicy(data);
    } catch (error) {
      console.error('Error loading policy:', error);
      toast.error('Errore nel caricamento della policy');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!policy?.policy_name?.trim()) {
      toast.error('Inserisci un nome per la policy');
      return;
    }

    setIsSaving(true);
    try {
      console.log('💾 Saving policy:', policy);

      const policyPayload = {
        policy_name: policy.policy_name,
        policy_type: policy.policy_type || 'custom',
        status: policy.status,
        version: policy.version,
        category: policy.category,
        iso_reference: policy.iso_reference,
        nis2_reference: policy.nis2_reference,
        purpose: policy.purpose,
        scope: policy.scope,
        policy_statement: policy.policy_statement,
        roles_responsibilities: policy.roles_responsibilities,
        procedures: policy.procedures,
        compliance_requirements: policy.compliance_requirements,
        review_requirements: policy.review_requirements,
        prepared_by: policy.prepared_by,
        approved_by: policy.approved_by,
        approval_date: policy.approval_date,
        next_review_date: policy.next_review_date,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('policies')
        .update(policyPayload)
        .eq('id', id);

      if (error) throw error;
      console.log('✅ Policy updated');
      toast.success('Policy aggiornata!');
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error('Errore nel salvataggio');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    console.log('✏️ Updating field:', field);
    setPolicy((prev: any) => ({ ...prev, [field]: value }));
  };

  const getStatusBadge = () => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline'; icon: any }> = {
      draft: { label: 'Bozza', variant: 'secondary', icon: Edit3 },
      in_review: { label: 'In Revisione', variant: 'default', icon: Clock },
      approved: { label: 'Approvata', variant: 'default', icon: CheckCircle },
      archived: { label: 'Archiviata', variant: 'outline', icon: Archive }
    };

    const config = statusConfig[policy?.status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Caricamento policy...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!policy) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-lg mb-4">❌ Policy non trovata</p>
            <Button onClick={() => navigate('/policies')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna alle Policy
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <PolicyNavigation currentPage={policy.policy_name || 'Modifica Policy'} />
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('🔙 Going back to policies');
                navigate('/policies');
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6" />
                {policy.policy_name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {policy.policy_id || 'POL-XXX'} • Versione {policy.version}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
          </div>
        </div>

        {/* Actions Bar */}
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Salvataggio...' : 'Salva'}
              </Button>
            </div>
            <Button variant="outline" onClick={() => navigate('/policies')}>
              Annulla
            </Button>
          </CardContent>
        </Card>

        {/* Editor Form */}
        <Card>
          <CardHeader>
            <CardTitle>Modifica Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="policy_name">Titolo Policy *</Label>
              <Input
                id="policy_name"
                value={policy.policy_name || ''}
                onChange={(e) => handleChange('policy_name', e.target.value)}
                placeholder="es. Information Security Policy"
              />
            </div>

            {/* Status & Version */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={policy.status || 'draft'}
                  onValueChange={(value) => handleChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">📝 Bozza</SelectItem>
                    <SelectItem value="in_review">👁️ In Revisione</SelectItem>
                    <SelectItem value="approved">✅ Approvata</SelectItem>
                    <SelectItem value="archived">📦 Archiviata</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Versione</Label>
                <Input
                  value={policy.version || '1.0'}
                  onChange={(e) => handleChange('version', e.target.value)}
                />
              </div>
            </div>

            <Separator />

            {/* Purpose */}
            <div className="space-y-2">
              <Label>1. Purpose (Scopo) *</Label>
              <Textarea
                value={policy.purpose || ''}
                onChange={(e) => handleChange('purpose', e.target.value)}
                placeholder="Definisci lo scopo di questa policy..."
                rows={4}
              />
            </div>

            {/* Scope */}
            <div className="space-y-2">
              <Label>2. Scope (Ambito) *</Label>
              <Textarea
                value={policy.scope || ''}
                onChange={(e) => handleChange('scope', e.target.value)}
                placeholder="A chi si applica questa policy..."
                rows={3}
              />
            </div>

            {/* Policy Statement */}
            <div className="space-y-2">
              <Label>3. Policy Statement (Dichiarazione) *</Label>
              <Textarea
                value={policy.policy_statement || ''}
                onChange={(e) => handleChange('policy_statement', e.target.value)}
                placeholder="I principi e requisiti della policy..."
                rows={6}
              />
            </div>

            {/* Roles */}
            <div className="space-y-2">
              <Label>4. Roles & Responsibilities</Label>
              <Textarea
                value={policy.roles_responsibilities || ''}
                onChange={(e) => handleChange('roles_responsibilities', e.target.value)}
                placeholder="Chi è responsabile di cosa..."
                rows={4}
              />
            </div>

            {/* Procedures */}
            <div className="space-y-2">
              <Label>5. Procedures (Procedure Correlate)</Label>
              <Textarea
                value={policy.procedures || ''}
                onChange={(e) => handleChange('procedures', e.target.value)}
                placeholder="Procedure operative collegate..."
                rows={3}
              />
            </div>

            {/* Compliance */}
            <div className="space-y-2">
              <Label>6. Compliance Requirements</Label>
              <Textarea
                value={policy.compliance_requirements || ''}
                onChange={(e) => handleChange('compliance_requirements', e.target.value)}
                placeholder="Requisiti legali, normativi, contrattuali..."
                rows={3}
              />
            </div>

            {/* Review */}
            <div className="space-y-2">
              <Label>7. Policy Review</Label>
              <Textarea
                value={policy.review_requirements || ''}
                onChange={(e) => handleChange('review_requirements', e.target.value)}
                placeholder="Frequenza e processo di revisione..."
                rows={2}
              />
            </div>

            <Separator />

            {/* Approval Info */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Prepared By</Label>
                <Input
                  value={policy.prepared_by || ''}
                  onChange={(e) => handleChange('prepared_by', e.target.value)}
                  placeholder="Nome"
                />
              </div>
              <div className="space-y-2">
                <Label>Approved By</Label>
                <Input
                  value={policy.approved_by || ''}
                  onChange={(e) => handleChange('approved_by', e.target.value)}
                  placeholder="Nome"
                />
              </div>
              <div className="space-y-2">
                <Label>Approval Date</Label>
                <Input
                  type="date"
                  value={policy.approval_date || ''}
                  onChange={(e) => handleChange('approval_date', e.target.value)}
                />
              </div>
            </div>

            {/* Next Review */}
            <div className="space-y-2">
              <Label>Next Review Date</Label>
              <Input
                type="date"
                value={policy.next_review_date || ''}
                onChange={(e) => handleChange('next_review_date', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button Bottom */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate('/policies')}>
            Annulla
          </Button>
          <Button onClick={handleSave} disabled={isSaving} size="lg">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Salvataggio...' : 'Salva Policy'}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
