import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Home, Plus, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ManagementReviewEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState<any>(null);
  const [actionItems, setActionItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoFetching, setAutoFetching] = useState(false);

  useEffect(() => {
    if (id) loadReview();
  }, [id]);

  const loadReview = async () => {
    try {
      const { data, error } = await supabase
        .from('management_reviews')
        .select('*, review_action_items(*)')
        .eq('id', id)
        .single();

      if (error) throw error;

      setReview(data);
      setActionItems(data.review_action_items || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Errore caricamento');
    } finally {
      setLoading(false);
    }
  };

  const autoPopulateInputs = async () => {
    try {
      setAutoFetching(true);
      
      // Get organization from database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Utente non autenticato');
        setAutoFetching(false);
        return;
      }

      const { data: orgMembers } = await (supabase as any)
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (!orgMembers) {
        toast.error('Nessuna organizzazione trovata');
        setAutoFetching(false);
        return;
      }

      const orgId = orgMembers.organization_id;

      // Fetch data from other modules  
      const [auditsRes, incidentsRes, risksRes] = await Promise.all([
        (supabase.from('audits') as any).select('*').order('audit_date', { ascending: false }).limit(3),
        (supabase.from('security_incidents') as any).select('*').order('detected_at', { ascending: false }).limit(10),
        (supabase.from('risks') as any).select('*').gte('inherent_risk_score', 15)
      ]);

      // Build summaries
      const auditSummary = auditsRes.data?.length > 0
        ? `Ultimi audit: ${auditsRes.data.map(a => `${a.audit_type} (${a.audit_date ? format(new Date(a.audit_date), 'dd/MM/yyyy') : 'N/A'})`).join(', ')}`
        : 'Nessun audit recente registrato.';

      const incidentsSummary = incidentsRes.data?.length > 0
        ? `${incidentsRes.data.length} incidenti negli ultimi mesi. Severity: ${incidentsRes.data.filter(i => i.severity === 'critical' || i.severity === 'high').length} critici/high.`
        : 'Nessun incidente significativo.';

      const risksSummary = risksRes.data?.length > 0
        ? `${risksRes.data.length} rischi critici identificati. Principali: ${risksRes.data.slice(0, 3).map(r => r.name).join('; ')}`
        : 'Nessun rischio critico identificato.';

      setReview((prev: any) => ({
        ...prev,
        audit_results_summary: auditSummary,
        monitoring_results: `Incidenti: ${incidentsSummary}\n\nRischi: ${risksSummary}`,
      }));

      toast.success('✅ Dati caricati automaticamente!');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Errore caricamento dati');
    } finally {
      setAutoFetching(false);
    }
  };

  const addActionItem = () => {
    const newAction = {
      id: `temp_${Date.now()}`,
      action_number: actionItems.length + 1,
      description: '',
      responsible_person: '',
      due_date: '',
      status: 'open',
      isNew: true
    };
    setActionItems([...actionItems, newAction]);
  };

  const removeActionItem = (index: number) => {
    setActionItems(actionItems.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Save review
      const { error: reviewError } = await supabase
        .from('management_reviews')
        .update({
          ...review,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (reviewError) throw reviewError;

      // Save action items
      for (const action of actionItems) {
        if (action.isNew) {
          const { error } = await supabase
            .from('review_action_items')
            .insert({
              review_id: id,
              action_number: action.action_number,
              description: action.description,
              responsible_person: action.responsible_person,
              due_date: action.due_date,
              status: action.status
            });
          if (error) throw error;
        } else if (action.id && !action.id.toString().startsWith('temp_')) {
          const { error } = await supabase
            .from('review_action_items')
            .update({
              description: action.description,
              responsible_person: action.responsible_person,
              due_date: action.due_date,
              status: action.status
            })
            .eq('id', action.id);
          if (error) throw error;
        }
      }

      toast.success('✅ Management Review salvato!');
      await loadReview();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Errore salvataggio');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Caricamento...</div>;
  if (!review) return <div className="p-6">Review non trovata</div>;

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <Home className="h-4 w-4 mr-1" />
        </Button>
        <span>/</span>
        <Button variant="ghost" size="sm" onClick={() => navigate('/management-review')}>
          Management Review
        </Button>
        <span>/</span>
        <span>{review.review_id}</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{review.review_id} - Management Review</h1>
          <p className="text-sm text-muted-foreground mt-1">
            ISO 27001:2022 Clause 9.3
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/management-review')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Indietro
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvataggio...' : 'Salva'}
          </Button>
        </div>
      </div>

      {/* Meeting Info */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Informazioni Riunione</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={autoPopulateInputs}
              disabled={autoFetching}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoFetching ? 'animate-spin' : ''}`} />
              Auto-carica Dati
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Riunione *</Label>
              <Input
                type="date"
                value={review.meeting_date || ''}
                onChange={(e) => setReview({...review, meeting_date: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Durata (minuti)</Label>
              <Input
                type="number"
                value={review.meeting_duration || ''}
                onChange={(e) => setReview({...review, meeting_duration: e.target.value})}
                placeholder="90"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Luogo</Label>
            <Input
              value={review.location || ''}
              onChange={(e) => setReview({...review, location: e.target.value})}
              placeholder="Sala riunioni / Online"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Presidente *</Label>
              <Input
                value={review.chairman || ''}
                onChange={(e) => setReview({...review, chairman: e.target.value})}
                placeholder="CEO / Managing Director"
              />
            </div>
            <div className="space-y-2">
              <Label>Segretario</Label>
              <Input
                value={review.secretary || ''}
                onChange={(e) => setReview({...review, secretary: e.target.value})}
                placeholder="CISO / Quality Manager"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Partecipanti (uno per riga)</Label>
            <Textarea
              value={review.attendees?.join('\n') || ''}
              onChange={(e) => setReview({...review, attendees: e.target.value.split('\n').filter((a: string) => a.trim())})}
              placeholder="CEO&#10;CISO&#10;CTO&#10;CFO"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Review Inputs */}
      <Card>
        <CardHeader>
          <CardTitle>Input del Riesame (Clause 9.3.2)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>1. Status Azioni Precedenti</Label>
            <Textarea
              value={review.previous_actions_status || ''}
              onChange={(e) => setReview({...review, previous_actions_status: e.target.value})}
              placeholder="Riepilogo stato azioni dalla review precedente..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>2. Cambiamenti Esterni e Interni Rilevanti</Label>
            <Textarea
              value={review.external_internal_changes || ''}
              onChange={(e) => setReview({...review, external_internal_changes: e.target.value})}
              placeholder="Es: Nuove normative, cambi organizzativi, nuove tecnologie..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>3. Feedback su Performance ISMS</Label>
            <Textarea
              value={review.isms_performance_feedback || ''}
              onChange={(e) => setReview({...review, isms_performance_feedback: e.target.value})}
              placeholder="Feedback da stakeholder, risultati obiettivi..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>4. Risultati Audit</Label>
            <Textarea
              value={review.audit_results_summary || ''}
              onChange={(e) => setReview({...review, audit_results_summary: e.target.value})}
              placeholder="Risultati audit interni ed esterni..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>5. Non-Conformità e Azioni Correttive</Label>
            <Textarea
              value={review.nonconformities_summary || ''}
              onChange={(e) => setReview({...review, nonconformities_summary: e.target.value})}
              placeholder="Riepilogo NC aperte e chiuse, efficacia azioni correttive..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>6. Risultati Monitoraggio e Misurazione</Label>
            <Textarea
              value={review.monitoring_results || ''}
              onChange={(e) => setReview({...review, monitoring_results: e.target.value})}
              placeholder="KPI, incidenti, rischi, controlli..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>7. Opportunità di Miglioramento</Label>
            <Textarea
              value={review.improvement_opportunities || ''}
              onChange={(e) => setReview({...review, improvement_opportunities: e.target.value})}
              placeholder="Suggerimenti per migliorare l'ISMS..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Review Outputs */}
      <Card>
        <CardHeader>
          <CardTitle>Output del Riesame (Clause 9.3.3)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Modifiche Necessarie all'ISMS</Label>
            <Textarea
              value={review.isms_changes_needed || ''}
              onChange={(e) => setReview({...review, isms_changes_needed: e.target.value})}
              placeholder="Modifiche richieste a policy, procedure, controlli..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Necessità di Risorse</Label>
            <Textarea
              value={review.resource_needs || ''}
              onChange={(e) => setReview({...review, resource_needs: e.target.value})}
              placeholder="Budget, personale, strumenti necessari..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Action Items</CardTitle>
            <Button size="sm" onClick={addActionItem}>
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi Azione
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {actionItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nessuna azione definita. Aggiungi le azioni da intraprendere.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {actionItems.map((action, index) => (
                <Card key={action.id || index} className="border">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="text-sm font-semibold">Azione #{action.action_number}</div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeActionItem(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Descrizione *</Label>
                        <Textarea
                          value={action.description || ''}
                          onChange={(e) => {
                            const updated = [...actionItems];
                            updated[index].description = e.target.value;
                            setActionItems(updated);
                          }}
                          placeholder="Cosa deve essere fatto..."
                          rows={2}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Responsabile *</Label>
                          <Input
                            value={action.responsible_person || ''}
                            onChange={(e) => {
                              const updated = [...actionItems];
                              updated[index].responsible_person = e.target.value;
                              setActionItems(updated);
                            }}
                            placeholder="Nome responsabile"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Scadenza *</Label>
                          <Input
                            type="date"
                            value={action.due_date || ''}
                            onChange={(e) => {
                              const updated = [...actionItems];
                              updated[index].due_date = e.target.value;
                              setActionItems(updated);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate('/management-review')}>
          Annulla
        </Button>
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvataggio...' : 'Salva Management Review'}
        </Button>
      </div>
    </div>
  );
}
