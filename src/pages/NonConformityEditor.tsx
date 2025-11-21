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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface NCFormData {
  nc_code: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  source: string;
  source_type: string;
  source_id: string;
  related_control: string;
  affected_clause: string;
  detected_date: string;
  detection_method: string;
  evidence: string;
  root_cause_analysis: string;
  corrective_action: string;
  responsible_person: string;
  deadline: string;
  implementation_date: string;
  implementation_notes: string;
  verified_by: string;
  verification_date: string;
  effectiveness_verified: boolean;
  closure_notes: string;
}

export default function NonConformityEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isNewNC = !id;

  const [formData, setFormData] = useState<NCFormData>({
    nc_code: '',
    title: '',
    description: '',
    severity: 'minor',
    status: 'open',
    source: 'other',
    source_type: '',
    source_id: '',
    related_control: '',
    affected_clause: '',
    detected_date: format(new Date(), 'yyyy-MM-dd'),
    detection_method: '',
    evidence: '',
    root_cause_analysis: '',
    corrective_action: '',
    responsible_person: '',
    deadline: '',
    implementation_date: '',
    implementation_notes: '',
    verified_by: '',
    verification_date: '',
    effectiveness_verified: false,
    closure_notes: ''
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [organizationId, setOrganizationId] = useState<string>('');

  // Load organization
  useEffect(() => {
    const loadOrganization = async () => {
      const { data, error } = await supabase
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

  // Generate NC code for new NC
  useEffect(() => {
    const generateCode = async () => {
      if (isNewNC && organizationId) {
        const { data, error } = await supabase.rpc('generate_nc_code', {
          org_id: organizationId
        });
        
        if (data && !error) {
          setFormData(prev => ({ ...prev, nc_code: data }));
        }
      }
    };
    generateCode();
  }, [isNewNC, organizationId]);

  // Load existing NC
  const { data: nc, isLoading } = useQuery({
    queryKey: ['non_conformity', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('non_conformities')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Populate form with existing data
  useEffect(() => {
    if (nc && (isInitialLoad || !hasUnsavedChanges)) {
      setFormData({
        nc_code: nc.nc_code || '',
        title: nc.title || '',
        description: nc.description || '',
        severity: nc.severity || 'minor',
        status: nc.status || 'open',
        source: nc.source || 'other',
        source_type: nc.source_type || '',
        source_id: nc.source_id || '',
        related_control: nc.related_control || '',
        affected_clause: nc.affected_clause || '',
        detected_date: nc.detected_date || format(new Date(), 'yyyy-MM-dd'),
        detection_method: nc.detection_method || '',
        evidence: nc.evidence || '',
        root_cause_analysis: nc.root_cause_analysis || '',
        corrective_action: nc.corrective_action || '',
        responsible_person: nc.responsible_person || '',
        deadline: nc.deadline || '',
        implementation_date: nc.implementation_date || '',
        implementation_notes: nc.implementation_notes || '',
        verified_by: nc.verified_by || '',
        verification_date: nc.verification_date || '',
        effectiveness_verified: nc.effectiveness_verified || false,
        closure_notes: nc.closure_notes || ''
      });
      
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    }
  }, [nc, hasUnsavedChanges, isInitialLoad]);

  const updateField = (field: keyof NCFormData, value: any) => {
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

      // Prepara SOLO i campi base che sappiamo esistere nella tabella
      const saveData: any = {
        organization_id: organizationId,
        nc_code: formData.nc_code,
        title: formData.title,
        description: formData.description,
        severity: formData.severity,
        status: formData.status,
        source: formData.source,
      };

      // Aggiungi detected_date SOLO se presente e valido
      if (formData.detected_date && formData.detected_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        saveData.detected_date = formData.detected_date;
      }

      // Aggiungi altri campi SOLO se non vuoti
      if (formData.related_control) saveData.related_control = formData.related_control;
      if (formData.affected_clause) saveData.affected_clause = formData.affected_clause;
      if (formData.detection_method) saveData.detection_method = formData.detection_method;
      if (formData.evidence) saveData.evidence = formData.evidence;
      if (formData.root_cause_analysis) saveData.root_cause_analysis = formData.root_cause_analysis;
      if (formData.corrective_action) saveData.corrective_action = formData.corrective_action;
      if (formData.responsible_person) saveData.responsible_person = formData.responsible_person;
      if (formData.implementation_notes) saveData.implementation_notes = formData.implementation_notes;
      if (formData.verified_by) saveData.verified_by = formData.verified_by;
      if (formData.closure_notes) saveData.closure_notes = formData.closure_notes;
      
      // Boolean field
      if (formData.effectiveness_verified !== undefined) {
        saveData.effectiveness_verified = formData.effectiveness_verified;
      }
      
      // Date opzionali - aggiungi solo se valide
      if (formData.deadline && formData.deadline.match(/^\d{4}-\d{2}-\d{2}$/)) {
        saveData.deadline = formData.deadline;
      }
      if (formData.implementation_date && formData.implementation_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        saveData.implementation_date = formData.implementation_date;
      }
      if (formData.verification_date && formData.verification_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        saveData.verification_date = formData.verification_date;
      }

      console.log('Saving data:', saveData); // Debug

      if (isNewNC) {
        const { data, error } = await supabase
          .from('non_conformities')
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
          .from('non_conformities')
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
      if (isNewNC) {
        queryClient.invalidateQueries({ queryKey: ['non_conformities'] });
        toast({ title: 'Successo', description: 'Non conformità creata con successo' });
        navigate(`/non-conformity/${savedData.id}`);
      } else {
        queryClient.setQueryData(['non_conformity', id], savedData);
        queryClient.invalidateQueries({ queryKey: ['non_conformities'], exact: false });
        toast({ title: 'Successo', description: 'Non conformità salvata con successo' });
      }
      setHasUnsavedChanges(false);
    },
    onError: (error: any) => {
      console.error('Save error details:', error);
      toast({
        title: 'Errore nel salvataggio',
        description: error.message || 'Errore sconosciuto',
        variant: 'destructive'
      });
    },
  });

  const handleSave = () => {
    // Validazione base
    if (!formData.title || !formData.description) {
      toast({
        title: 'Errore',
        description: 'Titolo e descrizione sono obbligatori',
        variant: 'destructive'
      });
      return;
    }

    saveMutation.mutate();
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Caricamento...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/non-conformity')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isNewNC ? 'Nuova Non Conformità' : `NC: ${formData.nc_code}`}
            </h1>
            <p className="text-muted-foreground">ISO 27001:2022 - Clausola 10.1</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={!hasUnsavedChanges || saveMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? 'Salvataggio...' : 'Salva'}
          </Button>
        </div>
      </div>

      {/* Warning per NC Maggiori */}
      {formData.severity === 'major' && (
        <Card className="mb-6 border-red-500 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-semibold">
                ATTENZIONE: Le NC Maggiori bloccano la certificazione e devono essere risolte prima dell'audit
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="info">1. Info NC</TabsTrigger>
          <TabsTrigger value="analysis">2. Analisi & Azioni</TabsTrigger>
          <TabsTrigger value="implementation">3. Implementazione</TabsTrigger>
          <TabsTrigger value="verification">4. Verifica</TabsTrigger>
          <TabsTrigger value="closure">5. Chiusura</TabsTrigger>
        </TabsList>

        {/* TAB 1: INFO NC */}
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Informazioni Non Conformità</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Codice NC</Label>
                  <Input value={formData.nc_code} disabled />
                </div>
                <div>
                  <Label>Data Rilevazione *</Label>
                  <Input
                    type="date"
                    value={formData.detected_date}
                    onChange={(e) => updateField('detected_date', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Titolo *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="Breve descrizione della non conformità"
                />
              </div>

              <div>
                <Label>Descrizione Dettagliata *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Descrizione completa della non conformità rilevata..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Gravità *</Label>
                  <Select value={formData.severity} onValueChange={(value) => updateField('severity', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="major">NC Maggiore (blocca certificazione)</SelectItem>
                      <SelectItem value="minor">NC Minore</SelectItem>
                      <SelectItem value="observation">Osservazione</SelectItem>
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
                      <SelectItem value="open">Aperta</SelectItem>
                      <SelectItem value="in_progress">In Lavorazione</SelectItem>
                      <SelectItem value="resolved">Risolta (da verificare)</SelectItem>
                      <SelectItem value="closed">Chiusa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Origine</Label>
                  <Select value={formData.source} onValueChange={(value) => updateField('source', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="audit_internal">Audit Interno</SelectItem>
                      <SelectItem value="audit_external">Audit Esterno</SelectItem>
                      <SelectItem value="incident">Incident</SelectItem>
                      <SelectItem value="management_review">Management Review</SelectItem>
                      <SelectItem value="other">Altro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Metodo Rilevazione</Label>
                  <Input
                    value={formData.detection_method}
                    onChange={(e) => updateField('detection_method', e.target.value)}
                    placeholder="Come è stata rilevata"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Controllo ISO Coinvolto</Label>
                  <Input
                    value={formData.related_control}
                    onChange={(e) => updateField('related_control', e.target.value)}
                    placeholder="es. A.5.1, A.8.2"
                  />
                </div>
                <div>
                  <Label>Clausola ISO Coinvolta</Label>
                  <Input
                    value={formData.affected_clause}
                    onChange={(e) => updateField('affected_clause', e.target.value)}
                    placeholder="es. Clausola 9.2"
                  />
                </div>
              </div>

              <div>
                <Label>Evidenze</Label>
                <Textarea
                  value={formData.evidence}
                  onChange={(e) => updateField('evidence', e.target.value)}
                  placeholder="Documenti, screenshot, log o altre evidenze della NC..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: ANALISI & AZIONI */}
        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle>Analisi Causa Radice e Azioni Correttive</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Root Cause Analysis (RCA) *</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Analisi delle cause profonde. Obbligatoria per ISO 27001.
                </p>
                <Textarea
                  value={formData.root_cause_analysis}
                  onChange={(e) => updateField('root_cause_analysis', e.target.value)}
                  placeholder="Perché è successo? Quali sono le cause profonde? Usa metodologie come 5 Whys, Fishbone, ecc..."
                  rows={5}
                />
              </div>

              <div>
                <Label>Azione Correttiva *</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Piano dettagliato per eliminare la causa radice e prevenire ricorrenze.
                </p>
                <Textarea
                  value={formData.corrective_action}
                  onChange={(e) => updateField('corrective_action', e.target.value)}
                  placeholder="Cosa verrà fatto per risolvere la NC e prevenire che si ripeta..."
                  rows={5}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Responsabile Azione *</Label>
                  <Input
                    value={formData.responsible_person}
                    onChange={(e) => updateField('responsible_person', e.target.value)}
                    placeholder="Nome del responsabile"
                  />
                </div>
                <div>
                  <Label>Scadenza *</Label>
                  <Input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => updateField('deadline', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: IMPLEMENTAZIONE */}
        <TabsContent value="implementation">
          <Card>
            <CardHeader>
              <CardTitle>Implementazione Azione Correttiva</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Data Implementazione</Label>
                <Input
                  type="date"
                  value={formData.implementation_date}
                  onChange={(e) => updateField('implementation_date', e.target.value)}
                />
              </div>

              <div>
                <Label>Note Implementazione</Label>
                <Textarea
                  value={formData.implementation_notes}
                  onChange={(e) => updateField('implementation_notes', e.target.value)}
                  placeholder="Descrivi cosa è stato fatto, eventuali problemi riscontrati, modifiche al piano..."
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: VERIFICA */}
        <TabsContent value="verification">
          <Card>
            <CardHeader>
              <CardTitle>Verifica Efficacia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900">
                  <strong>Importante:</strong> La verifica dell'efficacia è obbligatoria prima di chiudere una NC. 
                  Bisogna dimostrare che l'azione correttiva ha effettivamente risolto il problema.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Verificato da</Label>
                  <Input
                    value={formData.verified_by}
                    onChange={(e) => updateField('verified_by', e.target.value)}
                    placeholder="Nome del verificatore"
                  />
                </div>
                <div>
                  <Label>Data Verifica</Label>
                  <Input
                    type="date"
                    value={formData.verification_date}
                    onChange={(e) => updateField('verification_date', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="effectiveness_verified"
                  checked={formData.effectiveness_verified}
                  onCheckedChange={(checked) => updateField('effectiveness_verified', checked)}
                />
                <Label htmlFor="effectiveness_verified" className="cursor-pointer">
                  Efficacia verificata con successo
                </Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: CHIUSURA */}
        <TabsContent value="closure">
          <Card>
            <CardHeader>
              <CardTitle>Chiusura Non Conformità</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-900">
                  <strong>Chiusura NC:</strong> Prima di chiudere una NC, assicurati che:
                  <ul className="list-disc ml-5 mt-2">
                    <li>La Root Cause Analysis sia completa</li>
                    <li>L'azione correttiva sia stata implementata</li>
                    <li>L'efficacia sia stata verificata con successo</li>
                  </ul>
                </p>
              </div>

              <div>
                <Label>Note di Chiusura</Label>
                <Textarea
                  value={formData.closure_notes}
                  onChange={(e) => updateField('closure_notes', e.target.value)}
                  placeholder="Riepilogo finale, lezioni apprese, raccomandazioni..."
                  rows={6}
                />
              </div>

              {formData.status === 'closed' && (
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="text-sm font-semibold">
                    Questa NC è stata chiusa il {nc?.closed_at ? format(new Date(nc.closed_at), 'dd/MM/yyyy HH:mm') : '-'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
