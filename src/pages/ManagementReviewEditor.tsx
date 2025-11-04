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
      console.log('🔍 [loadReview] Loading review:', id);
      
      // Try real auth first
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      let orgId: string | null = null;
      
      if (!user || userError) {
        console.log('⚠️ [loadReview] No auth user, using DEMO mode');
        // DEMO mode: skip organization verification
      } else {
        console.log('✅ [loadReview] User authenticated:', user.email);
        
        // Get organization from members
        const { data: orgMembers } = await (supabase as any)
          .from('organization_members')
          .select('organization_id, organizations(*)')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (orgMembers?.organizations) {
          const org = orgMembers.organizations as any;
          orgId = org.id;
          console.log('✅ [loadReview] Organization:', org.name);
        }
      }

      // Load review
      const { data, error } = await supabase
        .from('management_reviews')
        .select('*, review_action_items(*)')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Verify review belongs to user's organization (only if we have orgId)
      if (orgId && data.organization_id !== orgId) {
        console.log('❌ [loadReview] Review does not belong to user org');
        toast.error('Accesso negato');
        navigate('/management-review');
        return;
      }

      console.log('✅ [loadReview] Review loaded successfully');
      setReview(data);
      setActionItems(data.review_action_items || []);
    } catch (error) {
      console.error('Error loading review:', error);
      toast.error('Errore caricamento review');
    } finally {
      setLoading(false);
    }
  };

  const autoPopulateInputs = async () => {
    try {
      setAutoFetching(true);
      console.log('🔍 [autoPopulate] Starting auto-population');
      
      // Get organization (with DEMO mode support)
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      let orgId: string;
      
      if (!user || userError) {
        console.log('⚠️ [autoPopulate] No auth user, using DEMO mode');
        // DEMO mode fallback: get first organization
        const { data: orgs } = await (supabase as any)
          .from('organization')
          .select('id')
          .limit(1)
          .single();
        
        if (!orgs) {
          console.log('❌ [autoPopulate] No organization');
          toast.error('Nessuna organizzazione disponibile');
          setAutoFetching(false);
          return;
        }
        
        orgId = orgs.id;
        console.log('✅ [autoPopulate] Using DEMO org:', orgId);
      } else {
        console.log('✅ [autoPopulate] User:', user.email);
        
        const { data: orgMembers } = await (supabase as any)
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (!orgMembers) {
          console.log('⚠️ [autoPopulate] No org members, using DEMO mode');
          const { data: orgs } = await (supabase as any)
            .from('organization')
            .select('id')
            .limit(1)
            .single();
          
          if (!orgs) {
            console.log('❌ [autoPopulate] No organization');
            toast.error('Nessuna organizzazione trovata');
            setAutoFetching(false);
            return;
          }
          
          orgId = orgs.id;
          console.log('✅ [autoPopulate] Using DEMO org (fallback):', orgId);
        } else {
          orgId = orgMembers.organization_id;
          console.log('✅ [autoPopulate] Organization ID:', orgId);
        }
      }

      // Date range: last 12 months
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      const dateFilter = twelveMonthsAgo.toISOString().split('T')[0];

      // Fetch data from multiple sources
      const [auditsRes, incidentsRes, risksRes] = await Promise.all([
        supabase
          .from('audits')
          .select('*')
          .order('audit_date', { ascending: false })
          .limit(5),
        supabase
          .from('security_incidents')
          .select('*')
          .eq('organization_id', orgId)
          .gte('detected_at', dateFilter)
          .order('detected_at', { ascending: false }),
        supabase
          .from('risks')
          .select('*')
          .eq('organization_id', orgId)
          .eq('status', 'Identificato')
          .order('inherent_risk_score', { ascending: false })
          .limit(10)
      ]);

      console.log('📊 [autoPopulate] Data loaded:', {
        audits: auditsRes.data?.length || 0,
        incidents: incidentsRes.data?.length || 0,
        risks: risksRes.data?.length || 0
      });

      // Build audit results summary
      let auditSummary = '';
      if (auditsRes.data && auditsRes.data.length > 0) {
        const completedAudits = auditsRes.data.filter(a => a.status === 'completed');
        auditSummary = `Audit recenti completati: ${completedAudits.length}\n\n`;
        auditSummary += auditsRes.data.slice(0, 3).map(a => 
          `• ${a.audit_name} (${new Date(a.audit_date).toLocaleDateString('it-IT')})\n  Tipo: ${a.audit_type}, Status: ${a.status}`
        ).join('\n\n');
      } else {
        auditSummary = 'Nessun audit registrato nel sistema';
      }

      // Build incidents summary
      let incidentsSummary = '';
      if (incidentsRes.data && incidentsRes.data.length > 0) {
        const highSeverity = incidentsRes.data.filter(i => i.severity === 'high' || i.severity === 'critical').length;
        incidentsSummary = `Incidenti ultimi 12 mesi: ${incidentsRes.data.length} totali\n`;
        incidentsSummary += `• Alta/Critica severità: ${highSeverity}\n`;
        incidentsSummary += `• Risolti: ${incidentsRes.data.filter(i => i.status === 'closed').length}\n\n`;
        incidentsSummary += 'Incidenti principali:\n';
        incidentsSummary += incidentsRes.data.slice(0, 5).map(i => 
          `• ${i.title} [${i.severity}] - ${i.status}`
        ).join('\n');
      } else {
        incidentsSummary = 'Nessun incidente registrato negli ultimi 12 mesi';
      }

      // Build risks summary
      let risksSummary = '';
      if (risksRes.data && risksRes.data.length > 0) {
        const highRisks = risksRes.data.filter(r => r.inherent_risk_score >= 15);
        const mediumRisks = risksRes.data.filter(r => r.inherent_risk_score >= 9 && r.inherent_risk_score < 15);
        
        risksSummary = `Rischi aperti identificati: ${risksRes.data.length} totali\n`;
        risksSummary += `• Alto rischio (≥15): ${highRisks.length}\n`;
        risksSummary += `• Medio rischio (9-14): ${mediumRisks.length}\n\n`;
        risksSummary += 'Rischi principali:\n';
        risksSummary += highRisks.slice(0, 5).map(r => 
          `• ${r.name} [Score: ${r.inherent_risk_score}]\n  Trattamento: ${r.treatment_strategy || 'Da definire'}`
        ).join('\n\n');
      } else {
        risksSummary = 'Nessun rischio ad alto livello identificato';
      }

      // Build monitoring results
      const monitoringSummary = `
Performance ISMS - Ultimi 12 mesi:
• Incidenti: ${incidentsRes.data?.length || 0}
• Audit completati: ${auditsRes.data?.filter(a => a.status === 'completed').length || 0}
• Rischi ad alto livello: ${risksRes.data?.filter(r => r.inherent_risk_score >= 15).length || 0}

Trend: ${incidentsRes.data && incidentsRes.data.length > 0 ? 'Attività rilevata' : 'Nessuna attività significativa'}
      `.trim();

      // Build improvement opportunities
      const improvements = [];
      if (incidentsRes.data && incidentsRes.data.filter(i => i.severity === 'high' || i.severity === 'critical').length > 0) {
        improvements.push('• Rafforzare procedure incident response per incidenti alta severità');
      }
      if (risksRes.data && risksRes.data.filter(r => !r.treatment_strategy).length > 0) {
        improvements.push('• Definire strategie trattamento per rischi senza piano');
      }
      if (auditsRes.data && auditsRes.data.filter(a => a.status !== 'completed').length > 0) {
        improvements.push('• Completare audit pianificati in sospeso');
      }
      
      const improvementsSummary = improvements.length > 0 
        ? improvements.join('\n')
        : 'Mantenere il livello attuale di controllo e monitoraggio';

      // Update review with auto-populated data
      const updatedReview = {
        ...review,
        audit_results_summary: auditSummary,
        isms_performance_feedback: incidentsSummary,
        improvement_opportunities: improvementsSummary,
        monitoring_results: monitoringSummary
      };

      setReview(updatedReview);

      // Save to database
      const { error: updateError } = await supabase
        .from('management_reviews')
        .update({
          audit_results_summary: auditSummary,
          isms_performance_feedback: incidentsSummary,
          improvement_opportunities: improvementsSummary,
          monitoring_results: monitoringSummary
        })
        .eq('id', id);

      if (updateError) {
        console.error('❌ [autoPopulate] Error saving:', updateError);
        throw updateError;
      }

      console.log('✅ [autoPopulate] Data auto-populated and saved');
      toast.success('✅ Dati caricati e salvati automaticamente');
    } catch (error) {
      console.error('❌ [autoPopulate] Error:', error);
      toast.error('Errore caricamento automatico dati');
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

      // Save review - only update actual database columns
      const { error: reviewError } = await supabase
        .from('management_reviews')
        .update({
          meeting_date: review.meeting_date,
          meeting_duration: review.meeting_duration,
          location: review.location,
          chairman: review.chairman,
          secretary: review.secretary,
          attendees: review.attendees,
          status: review.status,
          previous_actions_status: review.previous_actions_status,
          external_internal_changes: review.external_internal_changes,
          isms_performance_feedback: review.isms_performance_feedback,
          audit_results_summary: review.audit_results_summary,
          nonconformities_summary: review.nonconformities_summary,
          monitoring_results: review.monitoring_results,
          improvement_opportunities: review.improvement_opportunities,
          isms_changes_needed: review.isms_changes_needed,
          resource_needs: review.resource_needs,
          minutes_draft: review.minutes_draft,
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
