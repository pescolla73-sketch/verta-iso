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
import { format, addMonths } from 'date-fns';

interface DocumentFormData {
  document_code: string;
  document_title: string;
  document_type: string;
  document_category: string;
  current_version: string;
  version_date: string;
  status: string;
  document_owner: string;
  approver: string;
  reviewer: string;
  approval_date: string;
  approval_notes: string;
  review_frequency_months: number;
  next_review_date: string;
  last_review_date: string;
  document_location: string;
  access_level: string;
  description: string;
  purpose: string;
  scope: string;
  notes: string;
}

export default function DocumentControlEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isNew = !id;

  const [formData, setFormData] = useState<DocumentFormData>({
    document_code: '',
    document_title: '',
    document_type: 'policy',
    document_category: '',
    current_version: '1.0',
    version_date: format(new Date(), 'yyyy-MM-dd'),
    status: 'draft',
    document_owner: '',
    approver: '',
    reviewer: '',
    approval_date: '',
    approval_notes: '',
    review_frequency_months: 12,
    next_review_date: '',
    last_review_date: '',
    document_location: '',
    access_level: 'internal',
    description: '',
    purpose: '',
    scope: '',
    notes: ''
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [organizationId, setOrganizationId] = useState<string>('');

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

  useEffect(() => {
    const generateCode = async () => {
      if (isNew && organizationId && formData.document_type) {
        const { data } = await supabase.rpc('generate_document_code', {
          org_id: organizationId,
          doc_type: formData.document_type
        });
        
        if (data) {
          setFormData(prev => ({ ...prev, document_code: data }));
        }
      }
    };
    generateCode();
  }, [isNew, organizationId, formData.document_type]);

  // Auto-calculate next review date
  useEffect(() => {
    if (formData.version_date && formData.review_frequency_months) {
      const versionDate = new Date(formData.version_date);
      const nextReview = addMonths(versionDate, formData.review_frequency_months);
      setFormData(prev => ({
        ...prev,
        next_review_date: format(nextReview, 'yyyy-MM-dd')
      }));
    }
  }, [formData.version_date, formData.review_frequency_months]);

  const { data: document } = useQuery({
    queryKey: ['controlled_document', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('controlled_documents')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (document && (isInitialLoad || !hasUnsavedChanges)) {
      setFormData({
        document_code: document.document_code || '',
        document_title: document.document_title || '',
        document_type: document.document_type || 'policy',
        document_category: document.document_category || '',
        current_version: document.current_version || '1.0',
        version_date: document.version_date || format(new Date(), 'yyyy-MM-dd'),
        status: document.status || 'draft',
        document_owner: document.document_owner || '',
        approver: document.approver || '',
        reviewer: document.reviewer || '',
        approval_date: document.approval_date || '',
        approval_notes: document.approval_notes || '',
        review_frequency_months: document.review_frequency_months || 12,
        next_review_date: document.next_review_date || '',
        last_review_date: document.last_review_date || '',
        document_location: document.document_location || '',
        access_level: document.access_level || 'internal',
        description: document.description || '',
        purpose: document.purpose || '',
        scope: document.scope || '',
        notes: document.notes || ''
      });
      
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    }
  }, [document, hasUnsavedChanges, isInitialLoad]);

  const updateField = (field: keyof DocumentFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasUnsavedChanges(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId) throw new Error('Organization not found');

      const formatDate = (dateStr: string) => {
        if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
        return dateStr;
      };

      const saveData: any = {
        organization_id: organizationId,
        document_code: formData.document_code,
        document_title: formData.document_title,
        document_type: formData.document_type,
        current_version: formData.current_version,
        status: formData.status,
        document_owner: formData.document_owner,
        access_level: formData.access_level,
        review_frequency_months: formData.review_frequency_months,
      };

      saveData.version_date = formatDate(formData.version_date) || format(new Date(), 'yyyy-MM-dd');
      saveData.next_review_date = formatDate(formData.next_review_date);
      saveData.approval_date = formatDate(formData.approval_date);
      saveData.last_review_date = formatDate(formData.last_review_date);

      if (formData.document_category) saveData.document_category = formData.document_category;
      if (formData.approver) saveData.approver = formData.approver;
      if (formData.reviewer) saveData.reviewer = formData.reviewer;
      if (formData.approval_notes) saveData.approval_notes = formData.approval_notes;
      if (formData.document_location) saveData.document_location = formData.document_location;
      if (formData.description) saveData.description = formData.description;
      if (formData.purpose) saveData.purpose = formData.purpose;
      if (formData.scope) saveData.scope = formData.scope;
      if (formData.notes) saveData.notes = formData.notes;

      console.log('Saving document:', saveData);

      if (isNew) {
        const { data, error } = await supabase
          .from('controlled_documents')
          .insert([saveData])
          .select()
          .single();
        
        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        return data;
      } else {
        const { data, error } = await supabase
          .from('controlled_documents')
          .update(saveData)
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        return data;
      }
    },
    onSuccess: (savedData) => {
      if (isNew) {
        queryClient.invalidateQueries({ queryKey: ['controlled_documents'] });
        toast({ title: 'Successo', description: 'Documento creato con successo' });
        navigate(`/documents/${savedData.id}`);
      } else {
        queryClient.setQueryData(['controlled_document', id], savedData);
        queryClient.invalidateQueries({ queryKey: ['controlled_documents'], exact: false });
        toast({ title: 'Successo', description: 'Documento salvato con successo' });
      }
      setHasUnsavedChanges(false);
    },
    onError: (error: any) => {
      console.error('Save error:', error);
      toast({
        title: 'Errore',
        description: error.message || 'Errore nel salvataggio',
        variant: 'destructive'
      });
    },
  });

  const handleSave = () => {
    if (!formData.document_title || !formData.document_owner) {
      toast({
        title: 'Errore',
        description: 'Titolo e owner sono obbligatori',
        variant: 'destructive'
      });
      return;
    }
    saveMutation.mutate();
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/documents')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isNew ? 'Nuovo Documento Controllato' : formData.document_code}
            </h1>
            <p className="text-muted-foreground">ISO 27001:2022 - Clausola 7.5</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={!hasUnsavedChanges || saveMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? 'Salvataggio...' : 'Salva'}
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informazioni Documento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Codice</Label>
                <Input value={formData.document_code} disabled />
              </div>
              <div>
                <Label>Tipo *</Label>
                <Select 
                  value={formData.document_type} 
                  onValueChange={(value) => updateField('document_type', value)}
                  disabled={!isNew}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="policy">Policy</SelectItem>
                    <SelectItem value="procedure">Procedura</SelectItem>
                    <SelectItem value="instruction">Istruzione</SelectItem>
                    <SelectItem value="form">Modulo</SelectItem>
                    <SelectItem value="plan">Piano</SelectItem>
                    <SelectItem value="report">Report</SelectItem>
                    <SelectItem value="other">Altro</SelectItem>
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
                    <SelectItem value="draft">Bozza</SelectItem>
                    <SelectItem value="review">In Review</SelectItem>
                    <SelectItem value="approved">Approvato</SelectItem>
                    <SelectItem value="active">Attivo</SelectItem>
                    <SelectItem value="obsolete">Obsoleto</SelectItem>
                    <SelectItem value="archived">Archiviato</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Titolo *</Label>
              <Input
                value={formData.document_title}
                onChange={(e) => updateField('document_title', e.target.value)}
                placeholder="Titolo del documento"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoria</Label>
                <Input
                  value={formData.document_category}
                  onChange={(e) => updateField('document_category', e.target.value)}
                  placeholder="es. Sicurezza, Qualità..."
                />
              </div>
              <div>
                <Label>Livello Accesso</Label>
                <Select value={formData.access_level} onValueChange={(value) => updateField('access_level', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Pubblico</SelectItem>
                    <SelectItem value="internal">Interno</SelectItem>
                    <SelectItem value="confidential">Confidenziale</SelectItem>
                    <SelectItem value="restricted">Riservato</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Descrizione</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Descrizione breve del documento..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Versione e Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Versione Corrente</Label>
                <Input
                  value={formData.current_version}
                  onChange={(e) => updateField('current_version', e.target.value)}
                  placeholder="1.0"
                />
              </div>
              <div>
                <Label>Data Versione</Label>
                <Input
                  type="date"
                  value={formData.version_date}
                  onChange={(e) => updateField('version_date', e.target.value)}
                />
              </div>
              <div>
                <Label>Frequenza Review (mesi)</Label>
                <Input
                  type="number"
                  min="1"
                  max="60"
                  value={formData.review_frequency_months}
                  onChange={(e) => updateField('review_frequency_months', parseInt(e.target.value) || 12)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ultima Review</Label>
                <Input
                  type="date"
                  value={formData.last_review_date}
                  onChange={(e) => updateField('last_review_date', e.target.value)}
                />
              </div>
              <div>
                <Label>Prossima Review (auto-calcolata)</Label>
                <Input
                  type="date"
                  value={formData.next_review_date}
                  disabled
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Responsabilità</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Document Owner *</Label>
                <Input
                  value={formData.document_owner}
                  onChange={(e) => updateField('document_owner', e.target.value)}
                  placeholder="Nome owner"
                />
              </div>
              <div>
                <Label>Reviewer</Label>
                <Input
                  value={formData.reviewer}
                  onChange={(e) => updateField('reviewer', e.target.value)}
                  placeholder="Nome reviewer"
                />
              </div>
              <div>
                <Label>Approver</Label>
                <Input
                  value={formData.approver}
                  onChange={(e) => updateField('approver', e.target.value)}
                  placeholder="Nome approver"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data Approvazione</Label>
                <Input
                  type="date"
                  value={formData.approval_date}
                  onChange={(e) => updateField('approval_date', e.target.value)}
                />
              </div>
              <div>
                <Label>Location Documento</Label>
                <Input
                  value={formData.document_location}
                  onChange={(e) => updateField('document_location', e.target.value)}
                  placeholder="URL o path del documento"
                />
              </div>
            </div>

            <div>
              <Label>Note Approvazione</Label>
              <Textarea
                value={formData.approval_notes}
                onChange={(e) => updateField('approval_notes', e.target.value)}
                placeholder="Note relative all'approvazione..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dettagli Aggiuntivi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Scopo</Label>
              <Textarea
                value={formData.purpose}
                onChange={(e) => updateField('purpose', e.target.value)}
                placeholder="Scopo del documento..."
                rows={2}
              />
            </div>

            <div>
              <Label>Ambito</Label>
              <Textarea
                value={formData.scope}
                onChange={(e) => updateField('scope', e.target.value)}
                placeholder="Ambito di applicazione..."
                rows={2}
              />
            </div>

            <div>
              <Label>Note</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Note aggiuntive..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
