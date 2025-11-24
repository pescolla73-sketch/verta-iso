import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface AuditFormData {
  audit_code: string;
  audit_type: string;
  audit_date: string;
  audit_end_date: string;
  certification_body: string;
  lead_auditor: string;
  audit_team: string;
  audit_scope: string;
  standards: string;
  status: string;
  audit_result: string;
  major_findings_count: number;
  minor_findings_count: number;
  observations_count: number;
  certificate_number: string;
  certificate_issue_date: string;
  certificate_expiry_date: string;
  notes: string;
  audit_report_url: string;
}

export default function CertificationAuditEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isNew = !id;

  const [formData, setFormData] = useState<AuditFormData>({
    audit_code: '',
    audit_type: 'stage1',
    audit_date: format(new Date(), 'yyyy-MM-dd'),
    audit_end_date: '',
    certification_body: '',
    lead_auditor: '',
    audit_team: '',
    audit_scope: '',
    standards: 'ISO/IEC 27001:2022',
    status: 'scheduled',
    audit_result: 'pending',
    major_findings_count: 0,
    minor_findings_count: 0,
    observations_count: 0,
    certificate_number: '',
    certificate_issue_date: '',
    certificate_expiry_date: '',
    notes: '',
    audit_report_url: ''
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [organizationId, setOrganizationId] = useState<string>('');

  // Load organization
  useEffect(() => {
    const loadOrganization = async () => {
      const { data } = await supabase
        .from('organization')
        .select('id')
        .limit(1)
        .maybeSingle();
      
      if (data) {
        setOrganizationId(data.id);
      }
    };
    loadOrganization();
  }, []);

  // Generate audit code for new
  useEffect(() => {
    const generateCode = async () => {
      if (isNew && organizationId) {
        const { data } = await supabase.rpc('generate_audit_code', {
          org_id: organizationId
        });
        
        if (data) {
          setFormData(prev => ({ ...prev, audit_code: data }));
        }
      }
    };
    generateCode();
  }, [isNew, organizationId]);

  // Load existing audit
  const { data: audit } = useQuery({
    queryKey: ['certification_audit', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('certification_audits')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Populate form
  useEffect(() => {
    if (audit && (isInitialLoad || !hasUnsavedChanges)) {
      setFormData({
        audit_code: audit.audit_code || '',
        audit_type: audit.audit_type || 'stage1',
        audit_date: audit.audit_date || format(new Date(), 'yyyy-MM-dd'),
        audit_end_date: audit.audit_end_date || '',
        certification_body: audit.certification_body || '',
        lead_auditor: audit.lead_auditor || '',
        audit_team: audit.audit_team || '',
        audit_scope: audit.audit_scope || '',
        standards: audit.standards || 'ISO/IEC 27001:2022',
        status: audit.status || 'scheduled',
        audit_result: audit.audit_result || 'pending',
        major_findings_count: audit.major_findings_count || 0,
        minor_findings_count: audit.minor_findings_count || 0,
        observations_count: audit.observations_count || 0,
        certificate_number: audit.certificate_number || '',
        certificate_issue_date: audit.certificate_issue_date || '',
        certificate_expiry_date: audit.certificate_expiry_date || '',
        notes: audit.notes || '',
        audit_report_url: audit.audit_report_url || ''
      });
      
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    }
  }, [audit, hasUnsavedChanges, isInitialLoad]);

  const updateField = (field: keyof AuditFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasUnsavedChanges(true);
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId) throw new Error('Organization not found');

      const saveData: any = {
        organization_id: organizationId,
        audit_code: formData.audit_code,
        audit_type: formData.audit_type,
        certification_body: formData.certification_body,
        status: formData.status,
        standards: formData.standards,
        audit_result: formData.audit_result,
        major_findings_count: formData.major_findings_count,
        minor_findings_count: formData.minor_findings_count,
        observations_count: formData.observations_count,
      };

      // Add dates only if valid
      if (formData.audit_date && formData.audit_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        saveData.audit_date = formData.audit_date;
      }
      if (formData.audit_end_date && formData.audit_end_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        saveData.audit_end_date = formData.audit_end_date;
      }
      if (formData.certificate_issue_date && formData.certificate_issue_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        saveData.certificate_issue_date = formData.certificate_issue_date;
      }
      if (formData.certificate_expiry_date && formData.certificate_expiry_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        saveData.certificate_expiry_date = formData.certificate_expiry_date;
      }

      // Add optional fields only if not empty
      if (formData.lead_auditor) saveData.lead_auditor = formData.lead_auditor;
      if (formData.audit_team) saveData.audit_team = formData.audit_team;
      if (formData.audit_scope) saveData.audit_scope = formData.audit_scope;
      if (formData.certificate_number) saveData.certificate_number = formData.certificate_number;
      if (formData.notes) saveData.notes = formData.notes;
      if (formData.audit_report_url) saveData.audit_report_url = formData.audit_report_url;

      if (isNew) {
        const { data, error } = await supabase
          .from('certification_audits')
          .insert([saveData])
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('certification_audits')
          .update(saveData)
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (savedData) => {
      if (isNew) {
        queryClient.invalidateQueries({ queryKey: ['certification_audits'] });
        toast({ title: 'Successo', description: 'Audit creato con successo' });
        navigate(`/certification-audit/${savedData.id}`);
      } else {
        queryClient.setQueryData(['certification_audit', id], savedData);
        queryClient.invalidateQueries({ queryKey: ['certification_audits'], exact: false });
        toast({ title: 'Successo', description: 'Audit salvato con successo' });
      }
      setHasUnsavedChanges(false);
    },
    onError: (error: any) => {
      console.error('Save error:', error);
      toast({
        title: 'Errore',
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  const handleSave = () => {
    if (!formData.certification_body || !formData.audit_date) {
      toast({
        title: 'Errore',
        description: 'Ente certificatore e data audit sono obbligatori',
        variant: 'destructive'
      });
      return;
    }
    saveMutation.mutate();
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/certification-audit')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isNew ? 'Nuovo Audit Certificazione' : `Audit: ${formData.audit_code}`}
            </h1>
            <p className="text-muted-foreground">ISO/IEC 27001:2022</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={!hasUnsavedChanges || saveMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? 'Salvataggio...' : 'Salva'}
        </Button>
      </div>

      {/* Form */}
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informazioni Audit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Codice Audit</Label>
                <Input value={formData.audit_code} disabled />
              </div>
              <div>
                <Label>Tipo Audit *</Label>
                <Select value={formData.audit_type} onValueChange={(value) => updateField('audit_type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stage1">Stage 1 (Documentale)</SelectItem>
                    <SelectItem value="stage2">Stage 2 (Sul Campo)</SelectItem>
                    <SelectItem value="surveillance">Sorveglianza Annuale</SelectItem>
                    <SelectItem value="recertification">Ricertificazione</SelectItem>
                    <SelectItem value="special">Audit Speciale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Stato</Label>
                <Select value={formData.status} onValueChange={(value) => updateField('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Pianificato</SelectItem>
                    <SelectItem value="in_progress">In Corso</SelectItem>
                    <SelectItem value="completed">Completato</SelectItem>
                    <SelectItem value="certificate_issued">Certificato Emesso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data Inizio Audit *</Label>
                <Input
                  type="date"
                  value={formData.audit_date}
                  onChange={(e) => updateField('audit_date', e.target.value)}
                />
              </div>
              <div>
                <Label>Data Fine Audit</Label>
                <Input
                  type="date"
                  value={formData.audit_end_date}
                  onChange={(e) => updateField('audit_end_date', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Ente Certificatore *</Label>
              <Input
                value={formData.certification_body}
                onChange={(e) => updateField('certification_body', e.target.value)}
                placeholder="es. DNV, Bureau Veritas, TÜV..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Lead Auditor</Label>
                <Input
                  value={formData.lead_auditor}
                  onChange={(e) => updateField('lead_auditor', e.target.value)}
                  placeholder="Nome lead auditor"
                />
              </div>
              <div>
                <Label>Team Audit</Label>
                <Input
                  value={formData.audit_team}
                  onChange={(e) => updateField('audit_team', e.target.value)}
                  placeholder="Altri membri del team"
                />
              </div>
            </div>

            <div>
              <Label>Ambito Audit</Label>
              <Textarea
                value={formData.audit_scope}
                onChange={(e) => updateField('audit_scope', e.target.value)}
                placeholder="Descrivere l'ambito dell'audit..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risultati Audit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Risultato</Label>
              <Select value={formData.audit_result} onValueChange={(value) => updateField('audit_result', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="passed">Superato</SelectItem>
                  <SelectItem value="passed_with_nc">Superato con NC</SelectItem>
                  <SelectItem value="failed">Non Superato</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>NC Maggiori</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.major_findings_count}
                  onChange={(e) => updateField('major_findings_count', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label>NC Minori</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.minor_findings_count}
                  onChange={(e) => updateField('minor_findings_count', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label>Osservazioni</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.observations_count}
                  onChange={(e) => updateField('observations_count', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Certificato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Numero Certificato</Label>
              <Input
                value={formData.certificate_number}
                onChange={(e) => updateField('certificate_number', e.target.value)}
                placeholder="es. ISO27001-2025-001"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data Emissione</Label>
                <Input
                  type="date"
                  value={formData.certificate_issue_date}
                  onChange={(e) => updateField('certificate_issue_date', e.target.value)}
                />
              </div>
              <div>
                <Label>Data Scadenza</Label>
                <Input
                  type="date"
                  value={formData.certificate_expiry_date}
                  onChange={(e) => updateField('certificate_expiry_date', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Note e Documenti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Note</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Note aggiuntive sull'audit..."
                rows={4}
              />
            </div>

            <div>
              <Label>URL Report Audit</Label>
              <Input
                value={formData.audit_report_url}
                onChange={(e) => updateField('audit_report_url', e.target.value)}
                placeholder="Link al report completo dell'audit"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
