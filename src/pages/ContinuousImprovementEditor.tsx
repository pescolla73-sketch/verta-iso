import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Trash2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function ContinuousImprovementEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNew = !id;

  const [loading, setLoading] = useState(false);
  const [orgId, setOrgId] = useState<string>('');
  
  // Form state
  const [formData, setFormData] = useState({
    action_type: 'corrective',
    source: 'self_identified',
    source_id: '',
    title: '',
    description: '',
    problem_statement: '',
    opportunity_statement: '',
    root_cause_analysis: '',
    action_plan: '',
    expected_benefit: '',
    success_criteria: '',
    responsible_person: '',
    support_team: '',
    start_date: '',
    target_date: '',
    completion_date: '',
    estimated_effort: '',
    estimated_cost: '',
    resources_required: '',
    implementation_notes: '',
    implementation_status: 'planned',
    effectiveness_check_date: '',
    effectiveness_verified: false,
    effectiveness_notes: '',
    verified_by: '',
    status: 'open',
    priority: 'medium',
    closure_date: '',
    closure_notes: ''
  });

  useEffect(() => {
    loadOrgAndData();
  }, [id]);

  const loadOrgAndData = async () => {
    try {
      // Get organization
      const { data: org } = await supabase
        .from('organization')
        .select('id')
        .limit(1)
        .maybeSingle();
      
      if (org) {
        setOrgId(org.id);
      }

      // Load existing action if editing
      if (id) {
        const { data: action, error } = await supabase
          .from('improvement_actions')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (action) {
          setFormData({
            action_type: action.action_type || 'corrective',
            source: action.source || 'self_identified',
            source_id: action.source_id || '',
            title: action.title || '',
            description: action.description || '',
            problem_statement: action.problem_statement || '',
            opportunity_statement: action.opportunity_statement || '',
            root_cause_analysis: action.root_cause_analysis || '',
            action_plan: action.action_plan || '',
            expected_benefit: action.expected_benefit || '',
            success_criteria: action.success_criteria || '',
            responsible_person: action.responsible_person || '',
            support_team: action.support_team || '',
            start_date: action.start_date || '',
            target_date: action.target_date || '',
            completion_date: action.completion_date || '',
            estimated_effort: action.estimated_effort || '',
            estimated_cost: action.estimated_cost?.toString() || '',
            resources_required: action.resources_required || '',
            implementation_notes: action.implementation_notes || '',
            implementation_status: action.implementation_status || 'planned',
            effectiveness_check_date: action.effectiveness_check_date || '',
            effectiveness_verified: action.effectiveness_verified || false,
            effectiveness_notes: action.effectiveness_notes || '',
            verified_by: action.verified_by || '',
            status: action.status || 'open',
            priority: action.priority || 'medium',
            closure_date: action.closure_date || '',
            closure_notes: action.closure_notes || ''
          });
        }
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare i dati',
        variant: 'destructive'
      });
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Validation
      if (!formData.title || !formData.description || !formData.action_plan || !formData.responsible_person || !formData.target_date) {
        toast({
          title: 'Campi obbligatori mancanti',
          description: 'Compila tutti i campi obbligatori',
          variant: 'destructive'
        });
        return;
      }

      if (isNew) {
        // Generate action code
        const { data: codeData } = await supabase.rpc('generate_improvement_code', {
          org_id: orgId,
          action_type_param: formData.action_type
        });

        const action_code = codeData;

        // Create new action
        const { error: insertError } = await supabase
          .from('improvement_actions')
          .insert({
            organization_id: orgId,
            action_code,
            ...formData,
            estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null
          });

        if (insertError) throw insertError;

        toast({
          title: 'Azione creata',
          description: `Azione ${action_code} creata con successo`
        });
      } else {
        // Update existing action
        const { error: updateError } = await supabase
          .from('improvement_actions')
          .update({
            ...formData,
            estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null
          })
          .eq('id', id);

        if (updateError) throw updateError;

        toast({
          title: 'Azione aggiornata',
          description: 'Modifiche salvate con successo'
        });
      }

      navigate('/improvement');
    } catch (error: any) {
      console.error('Error saving action:', error);
      toast({
        title: 'Errore',
        description: error.message || 'Impossibile salvare l\'azione',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Sei sicuro di voler eliminare questa azione?')) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('improvement_actions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Azione eliminata',
        description: 'Azione rimossa con successo'
      });

      navigate('/improvement');
    } catch (error: any) {
      console.error('Error deleting action:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile eliminare l\'azione',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/improvement')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isNew ? 'Nuova Azione di Miglioramento' : 'Modifica Azione'}
            </h1>
            <p className="text-muted-foreground">ISO 27001:2022 - Clausola 10.2</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isNew && (
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              <Trash2 className="h-4 w-4 mr-2" />
              Elimina
            </Button>
          )}
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Salvataggio...' : 'Salva'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Informazioni Generali</TabsTrigger>
          <TabsTrigger value="analysis">Analisi</TabsTrigger>
          <TabsTrigger value="plan">Piano d'Azione</TabsTrigger>
          <TabsTrigger value="implementation">Implementazione</TabsTrigger>
          <TabsTrigger value="verification">Verifica Efficacia</TabsTrigger>
          <TabsTrigger value="closure">Chiusura</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tipo e Origine</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tipo Azione *</Label>
                  <Select value={formData.action_type} onValueChange={(v) => updateField('action_type', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corrective">Azione Correttiva</SelectItem>
                      <SelectItem value="preventive">Azione Preventiva</SelectItem>
                      <SelectItem value="improvement">Miglioramento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Origine *</Label>
                  <Select value={formData.source} onValueChange={(v) => updateField('source', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nc">Non Conformità</SelectItem>
                      <SelectItem value="audit">Audit</SelectItem>
                      <SelectItem value="incident">Incidente</SelectItem>
                      <SelectItem value="management_review">Management Review</SelectItem>
                      <SelectItem value="risk_assessment">Risk Assessment</SelectItem>
                      <SelectItem value="self_identified">Auto-identificato</SelectItem>
                      <SelectItem value="other">Altro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Priorità *</Label>
                  <Select value={formData.priority} onValueChange={(v) => updateField('priority', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critica</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="low">Bassa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Stato *</Label>
                  <Select value={formData.status} onValueChange={(v) => updateField('status', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Aperta</SelectItem>
                      <SelectItem value="in_progress">In Corso</SelectItem>
                      <SelectItem value="completed">Completata</SelectItem>
                      <SelectItem value="verified">Verificata</SelectItem>
                      <SelectItem value="closed">Chiusa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Titolo *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="Titolo breve dell'azione"
                />
              </div>

              <div>
                <Label>Descrizione *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Descrizione dettagliata dell'azione"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analisi e Contesto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.action_type === 'corrective' && (
                <>
                  <div>
                    <Label>Descrizione Problema</Label>
                    <Textarea
                      value={formData.problem_statement}
                      onChange={(e) => updateField('problem_statement', e.target.value)}
                      placeholder="Descrivi il problema riscontrato"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label>Root Cause Analysis</Label>
                    <Textarea
                      value={formData.root_cause_analysis}
                      onChange={(e) => updateField('root_cause_analysis', e.target.value)}
                      placeholder="Analisi delle cause radice (es. 5 Whys, Fishbone)"
                      rows={6}
                    />
                  </div>
                </>
              )}

              {formData.action_type === 'preventive' && (
                <div>
                  <Label>Descrizione Opportunità</Label>
                  <Textarea
                    value={formData.opportunity_statement}
                    onChange={(e) => updateField('opportunity_statement', e.target.value)}
                    placeholder="Descrivi l'opportunità di miglioramento preventivo"
                    rows={4}
                  />
                </div>
              )}

              <div>
                <Label>Benefici Attesi</Label>
                <Textarea
                  value={formData.expected_benefit}
                  onChange={(e) => updateField('expected_benefit', e.target.value)}
                  placeholder="Quali benefici ci si aspetta da questa azione?"
                  rows={3}
                />
              </div>

              <div>
                <Label>Criteri di Successo</Label>
                <Textarea
                  value={formData.success_criteria}
                  onChange={(e) => updateField('success_criteria', e.target.value)}
                  placeholder="Come misureremo il successo dell'azione?"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Action Plan Tab */}
        <TabsContent value="plan" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Piano d'Azione</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Piano d'Azione *</Label>
                <Textarea
                  value={formData.action_plan}
                  onChange={(e) => updateField('action_plan', e.target.value)}
                  placeholder="Descrivi i passi specifici da intraprendere"
                  rows={6}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Responsabile *</Label>
                  <Input
                    value={formData.responsible_person}
                    onChange={(e) => updateField('responsible_person', e.target.value)}
                    placeholder="Nome del responsabile"
                  />
                </div>

                <div>
                  <Label>Team di Supporto</Label>
                  <Input
                    value={formData.support_team}
                    onChange={(e) => updateField('support_team', e.target.value)}
                    placeholder="Membri del team coinvolti"
                  />
                </div>

                <div>
                  <Label>Data Inizio</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => updateField('start_date', e.target.value)}
                  />
                </div>

                <div>
                  <Label>Scadenza *</Label>
                  <Input
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => updateField('target_date', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Sforzo Stimato</Label>
                  <Input
                    value={formData.estimated_effort}
                    onChange={(e) => updateField('estimated_effort', e.target.value)}
                    placeholder="es. 40 ore, 2 settimane"
                  />
                </div>

                <div>
                  <Label>Costo Stimato (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.estimated_cost}
                    onChange={(e) => updateField('estimated_cost', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <Label>Risorse Necessarie</Label>
                <Textarea
                  value={formData.resources_required}
                  onChange={(e) => updateField('resources_required', e.target.value)}
                  placeholder="Descrivi le risorse necessarie (persone, strumenti, budget)"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Implementation Tab */}
        <TabsContent value="implementation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Implementazione</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Stato Implementazione</Label>
                  <Select value={formData.implementation_status} onValueChange={(v) => updateField('implementation_status', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Pianificata</SelectItem>
                      <SelectItem value="in_progress">In Corso</SelectItem>
                      <SelectItem value="implemented">Implementata</SelectItem>
                      <SelectItem value="on_hold">In Pausa</SelectItem>
                      <SelectItem value="cancelled">Cancellata</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Data Completamento</Label>
                  <Input
                    type="date"
                    value={formData.completion_date}
                    onChange={(e) => updateField('completion_date', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Note di Implementazione</Label>
                <Textarea
                  value={formData.implementation_notes}
                  onChange={(e) => updateField('implementation_notes', e.target.value)}
                  placeholder="Documenta i progressi, ostacoli, modifiche al piano"
                  rows={8}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verification Tab */}
        <TabsContent value="verification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Verifica Efficacia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
                <Checkbox
                  id="effectiveness"
                  checked={formData.effectiveness_verified}
                  onCheckedChange={(checked) => updateField('effectiveness_verified', checked)}
                />
                <Label htmlFor="effectiveness" className="font-semibold cursor-pointer">
                  Efficacia Verificata
                </Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Data Verifica</Label>
                  <Input
                    type="date"
                    value={formData.effectiveness_check_date}
                    onChange={(e) => updateField('effectiveness_check_date', e.target.value)}
                  />
                </div>

                <div>
                  <Label>Verificato da</Label>
                  <Input
                    value={formData.verified_by}
                    onChange={(e) => updateField('verified_by', e.target.value)}
                    placeholder="Nome del verificatore"
                  />
                </div>
              </div>

              <div>
                <Label>Note Verifica</Label>
                <Textarea
                  value={formData.effectiveness_notes}
                  onChange={(e) => updateField('effectiveness_notes', e.target.value)}
                  placeholder="Risultati della verifica, metriche, evidenze"
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Closure Tab */}
        <TabsContent value="closure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chiusura Azione</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Data Chiusura</Label>
                <Input
                  type="date"
                  value={formData.closure_date}
                  onChange={(e) => updateField('closure_date', e.target.value)}
                />
              </div>

              <div>
                <Label>Note di Chiusura</Label>
                <Textarea
                  value={formData.closure_notes}
                  onChange={(e) => updateField('closure_notes', e.target.value)}
                  placeholder="Riepilogo finale, lezioni apprese, raccomandazioni"
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate('/improvement')}>
          Annulla
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Salvataggio...' : 'Salva Azione'}
        </Button>
      </div>
    </div>
  );
}
