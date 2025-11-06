import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar, Plus, AlertTriangle, Trash2, Edit, Target, Shield, CheckCircle2, Sparkles, Search, X, Filter } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getSmartSuggestions } from '@/utils/auditLinkage';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function AuditPlanPage() {
  const navigate = useNavigate();
  const [audits, setAudits] = useState<any[]>([]);
  const [smartSuggestions, setSmartSuggestions] = useState<any>({
    toVerify: [],
    highRisks: [],
    ncToVerify: []
  });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [smartAuditModalOpen, setSmartAuditModalOpen] = useState(false);
  const [selectedControls, setSelectedControls] = useState<string[]>([]);
  const [smartAuditorName, setSmartAuditorName] = useState('');
  const [formData, setFormData] = useState({
    audit_code: '',
    audit_date: '',
    planned_date: '',
    audit_scope: '',
    auditor_name: '',
    auditee_name: '',
    objective: '',
    audit_type: 'internal'
  });
  
  // Advanced Filters State
  const [filters, setFilters] = useState({
    searchText: '',
    auditor: 'all',
    auditType: 'all',
    dateFrom: undefined as Date | undefined,
    dateTo: undefined as Date | undefined
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get organization ID
      const { data: orgData } = await supabase
        .from('organization')
        .select('id')
        .limit(1)
        .single();
      
      const orgId = orgData?.id || '00000000-0000-0000-0000-000000000000';

      // Load planned audits
      const { data: auditsData, error: auditsError } = await supabase
        .from('internal_audits')
        .select('*')
        .eq('organization_id', orgId)
        .in('status', ['planned', 'in_progress'])
        .order('planned_date', { ascending: true });
      if (auditsError) throw auditsError;

      setAudits(auditsData || []);

      // Load smart suggestions
      const suggestions = await getSmartSuggestions(orgId);
      setSmartSuggestions(suggestions);

    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare i dati',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { data, error } = await supabase
        .from('internal_audits')
        .insert({
          ...formData,
          organization_id: '00000000-0000-0000-0000-000000000000',
          status: 'planned'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Successo',
        description: 'Audit pianificato correttamente'
      });

      setModalOpen(false);
      navigate(`/audit-interni/esegui/${data.id}`);
    } catch (error: any) {
      console.error('Error saving audit:', error);
      toast({
        title: 'Errore',
        description: error.message || 'Errore nel salvataggio',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questo audit?')) return;

    try {
      const { error } = await supabase
        .from('internal_audits')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Successo',
        description: 'Audit eliminato'
      });

      loadData();
    } catch (error: any) {
      console.error('Error deleting audit:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile eliminare',
        variant: 'destructive'
      });
    }
  };

  // Filter audits based on all filter criteria
  const filteredAudits = audits.filter(audit => {
    // Search text filter (scope and code)
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      const matchesScope = audit.audit_scope?.toLowerCase().includes(searchLower);
      const matchesCode = audit.audit_code?.toLowerCase().includes(searchLower);
      if (!matchesScope && !matchesCode) return false;
    }

    // Auditor filter
    if (filters.auditor !== 'all' && audit.auditor_name !== filters.auditor) {
      return false;
    }

    // Audit type filter
    if (filters.auditType !== 'all' && audit.audit_type !== filters.auditType) {
      return false;
    }

    // Date range filter
    if (filters.dateFrom && audit.planned_date) {
      const auditDate = new Date(audit.planned_date);
      if (auditDate < filters.dateFrom) return false;
    }
    if (filters.dateTo && audit.planned_date) {
      const auditDate = new Date(audit.planned_date);
      if (auditDate > filters.dateTo) return false;
    }

    return true;
  });

  // Get unique auditors for filter dropdown
  const uniqueAuditors = Array.from(new Set(audits.map(a => a.auditor_name).filter(Boolean)));

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      searchText: '',
      auditor: 'all',
      auditType: 'all',
      dateFrom: undefined,
      dateTo: undefined
    });
  };

  const hasActiveFilters = 
    filters.searchText || 
    filters.auditor !== 'all' || 
    filters.auditType !== 'all' ||
    filters.dateFrom ||
    filters.dateTo;

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Piano Audit Annuale
          </h1>
          <p className="text-muted-foreground mt-1">Pianificazione audit interni</p>
        </div>
        <Button onClick={() => navigate('/audit-interni')}>
          Torna agli Audit
        </Button>
      </div>

      {/* SMART SUGGESTIONS - 3 SECTIONS */}
      {(smartSuggestions.toVerify.length > 0 || smartSuggestions.highRisks.length > 0 || smartSuggestions.ncToVerify.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* SECTION 1: Controls To Verify */}
          {smartSuggestions.toVerify.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-5 w-5 text-red-500" />
                  🔴 Controlli da Verificare
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">
                  Controlli implementati da verificare in audit. Priorità alta se &gt;1 anno.
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {smartSuggestions.toVerify.slice(0, 10).map((item: any, i: number) => {
                    const daysOld = item.implementation_date 
                      ? Math.floor((Date.now() - new Date(item.implementation_date).getTime()) / (1000 * 60 * 60 * 24))
                      : 0;
                    const isUrgent = daysOld > 365;
                    
                    return (
                      <div key={i} className={`p-2 rounded text-xs space-y-1 ${isUrgent ? 'bg-red-50 border border-red-200' : 'bg-muted'}`}>
                        <div className="font-medium flex items-center justify-between">
                          <span>{item.control_reference} - {item.control_title?.substring(0, 40)}...</span>
                          {isUrgent && <Badge variant="destructive" className="text-xs">URGENTE</Badge>}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">Implementato</Badge>
                          {item.implementation_date && (
                            <span className={`text-muted-foreground ${isUrgent ? 'font-semibold text-red-600' : ''}`}>
                              {daysOld} giorni fa
                            </span>
                          )}
                          {item.responsible_person && (
                            <span className="text-muted-foreground">👤 {item.responsible_person}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {smartSuggestions.toVerify.length > 10 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    +{smartSuggestions.toVerify.length - 10} altri controlli
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* SECTION 2: High Risks Not Verified */}
          {smartSuggestions.highRisks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-5 w-5 text-orange-500" />
                  🟠 Rischi Alti Non Verificati
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">
                  Rischi con score ≥12 che richiedono verifica dei controlli correlati
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {smartSuggestions.highRisks.slice(0, 10).map((risk: any, i: number) => (
                    <div key={i} className="p-2 bg-muted rounded text-xs space-y-1">
                      <div className="font-medium flex items-center justify-between">
                        <span>{risk.name?.substring(0, 50)}...</span>
                        <Badge variant="destructive" className="text-xs">
                          {risk.inherent_risk_score}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {risk.related_controls && risk.related_controls.length > 0 && (
                          <span className="text-muted-foreground">
                            🛡️ {risk.related_controls.length} controlli correlati
                          </span>
                        )}
                        {risk.status && (
                          <Badge variant="outline" className="text-xs">{risk.status}</Badge>
                        )}
                      </div>
                      {risk.related_controls && (
                        <div className="text-muted-foreground">
                          {risk.related_controls.slice(0, 3).join(', ')}
                          {risk.related_controls.length > 3 && '...'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {smartSuggestions.highRisks.length > 10 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    +{smartSuggestions.highRisks.length - 10} altri rischi
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* SECTION 3: NC With Completed Actions */}
          {smartSuggestions.ncToVerify.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle2 className="h-5 w-5 text-yellow-500" />
                  🟡 NC con Azioni Completate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">
                  Non-conformità in attesa di verifica efficacia delle azioni correttive
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {smartSuggestions.ncToVerify.slice(0, 10).map((nc: any, i: number) => (
                    <div key={i} className="p-2 bg-muted rounded text-xs space-y-1">
                      <div className="font-medium flex items-center justify-between">
                        <span>{nc.title?.substring(0, 50)}...</span>
                        <Badge 
                          variant={nc.severity === 'major' ? 'destructive' : 'secondary'} 
                          className="text-xs"
                        >
                          {nc.severity}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {nc.related_control && (
                          <>
                            <span className="text-muted-foreground">🎯 {nc.related_control}</span>
                            <span className="text-muted-foreground">|</span>
                          </>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {nc.status}
                        </Badge>
                      </div>
                      {nc.nc_code && (
                        <div className="text-muted-foreground font-mono">
                          {nc.nc_code}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {smartSuggestions.ncToVerify.length > 10 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    +{smartSuggestions.ncToVerify.length - 10} altre NC
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* SMART AUDIT BUTTON */}
      {(smartSuggestions.toVerify.length > 0 || smartSuggestions.highRisks.length > 0 || smartSuggestions.ncToVerify.length > 0) && (
        <div className="flex justify-center">
          <Dialog open={smartAuditModalOpen} onOpenChange={setSmartAuditModalOpen}>
            <DialogTrigger asChild>
              <Button 
                size="lg" 
                onClick={() => {
                  // Pre-select all suggested controls
                  const controls = new Set<string>();
                  smartSuggestions.toVerify.forEach((item: any) => controls.add(item.control_reference));
                  smartSuggestions.highRisks.forEach((risk: any) => {
                    if (risk.related_controls) {
                      risk.related_controls.forEach((c: string) => controls.add(c));
                    }
                  });
                  smartSuggestions.ncToVerify.forEach((nc: any) => {
                    if (nc.related_control) controls.add(nc.related_control);
                  });
                  setSelectedControls(Array.from(controls));
                }}
                className="gap-2"
              >
                <Sparkles className="h-5 w-5" />
                Crea Audit Intelligente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Crea Audit Intelligente
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Auditor</Label>
                  <Input
                    value={smartAuditorName}
                    onChange={e => setSmartAuditorName(e.target.value)}
                    placeholder="Nome auditor"
                  />
                </div>
                
                <div>
                  <Label>Controlli Selezionati ({selectedControls.length})</Label>
                  <div className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-2 mt-2">
                    {selectedControls.map(control => {
                      // Find the control details
                      const item = smartSuggestions.toVerify.find((i: any) => i.control_reference === control);
                      return (
                        <div key={control} className="flex items-center gap-2 p-2 bg-muted rounded">
                          <Checkbox
                            checked={true}
                            onCheckedChange={(checked) => {
                              if (!checked) {
                                setSelectedControls(prev => prev.filter(c => c !== control));
                              }
                            }}
                          />
                          <span className="font-mono text-sm">{control}</span>
                          {item && <span className="text-xs text-muted-foreground">- {item.control_title?.substring(0, 50)}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Button
                  onClick={async () => {
                    if (!smartAuditorName) {
                      toast({
                        title: 'Errore',
                        description: 'Inserire nome auditor',
                        variant: 'destructive'
                      });
                      return;
                    }

                    if (selectedControls.length === 0) {
                      toast({
                        title: 'Errore',
                        description: 'Selezionare almeno un controllo',
                        variant: 'destructive'
                      });
                      return;
                    }

                    try {
                      // Get org ID
                      const { data: orgData } = await supabase
                        .from('organization')
                        .select('id')
                        .limit(1)
                        .single();
                      const orgId = orgData?.id || '00000000-0000-0000-0000-000000000000';

                      // Count existing audits
                      const { data: existingAudits } = await supabase
                        .from('internal_audits')
                        .select('audit_code')
                        .eq('organization_id', orgId);

                      const auditCount = existingAudits?.length || 0;
                      const auditCode = `AUD-${new Date().getFullYear()}-${String(auditCount + 1).padStart(3, '0')}`;
                      const scope = selectedControls.join(', ');

                      // Create audit
                      const { data: newAudit, error: auditError } = await supabase
                        .from('internal_audits')
                        .insert({
                          organization_id: orgId,
                          audit_code: auditCode,
                          audit_type: 'smart',
                          audit_scope: scope,
                          audit_date: new Date().toISOString().split('T')[0],
                          planned_date: new Date().toISOString().split('T')[0],
                          auditor_name: smartAuditorName,
                          status: 'planned',
                          objective: `Verificare implementazione controlli: ${scope}`
                        })
                        .select()
                        .single();

                      if (auditError) throw auditError;

                      // Pre-populate checklist from SoA
                      const { data: soaItems } = await supabase
                        .from('soa_items')
                        .select('*')
                        .eq('organization_id', orgId)
                        .in('control_reference', selectedControls);

                      if (soaItems && soaItems.length > 0) {
                        await supabase
                          .from('audit_checklist_items')
                          .insert(
                            soaItems.map(item => ({
                              audit_id: newAudit.id,
                              control_reference: item.control_reference,
                              control_title: item.control_title,
                              requirement: `Verificare evidenze implementazione ${item.control_reference}`,
                              evidence_required: 'Policy, procedure, log, configurazioni',
                              evidence_found: '',
                              audit_notes: '',
                              result: null,
                              pre_audit_status: item.implementation_status,
                              update_linked: true,
                              auto_create_nc: true,
                              source_type: 'smart'
                            }))
                          );
                      }

                      toast({
                        title: 'Audit Creato',
                        description: `${selectedControls.length} controlli da verificare`
                      });

                      setSmartAuditModalOpen(false);
                      setSmartAuditorName('');
                      navigate(`/audit-interni/esegui/${newAudit.id}`);
                    } catch (error: any) {
                      console.error('Error creating smart audit:', error);
                      toast({
                        title: 'Errore',
                        description: error.message,
                        variant: 'destructive'
                      });
                    }
                  }}
                  className="w-full"
                  size="lg"
                >
                  Crea Audit con {selectedControls.length} Controlli
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Audit Pianificati</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filtri {hasActiveFilters && `(${Object.values(filters).filter(v => v && v !== 'all').length})`}
              </Button>
              <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Pianifica Nuovo Audit
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Pianifica Nuovo Audit</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Codice Audit</Label>
                    <Input
                      value={formData.audit_code}
                      onChange={e => setFormData({ ...formData, audit_code: e.target.value })}
                      placeholder="AUD-2024-01"
                    />
                  </div>
                  <div>
                    <Label>Tipo Audit</Label>
                    <Select
                      value={formData.audit_type}
                      onValueChange={v => setFormData({ ...formData, audit_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="internal">Interno</SelectItem>
                        <SelectItem value="follow_up">Follow-up</SelectItem>
                        <SelectItem value="special">Speciale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Data Pianificata</Label>
                    <Input
                      type="date"
                      value={formData.planned_date}
                      onChange={e => setFormData({ ...formData, planned_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Data Esecuzione</Label>
                    <Input
                      type="date"
                      value={formData.audit_date}
                      onChange={e => setFormData({ ...formData, audit_date: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Ambito Audit</Label>
                    <Input
                      value={formData.audit_scope}
                      onChange={e => setFormData({ ...formData, audit_scope: e.target.value })}
                      placeholder="Es: Controlli tecnici A.8"
                    />
                  </div>
                  <div>
                    <Label>Auditor</Label>
                    <Input
                      value={formData.auditor_name}
                      onChange={e => setFormData({ ...formData, auditor_name: e.target.value })}
                      placeholder="Nome Cognome"
                    />
                  </div>
                  <div>
                    <Label>Auditato</Label>
                    <Input
                      value={formData.auditee_name}
                      onChange={e => setFormData({ ...formData, auditee_name: e.target.value })}
                      placeholder="Nome Cognome / Dipartimento"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Obiettivo</Label>
                    <Textarea
                      value={formData.objective}
                      onChange={e => setFormData({ ...formData, objective: e.target.value })}
                      placeholder="Descrivere l'obiettivo dell'audit"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setModalOpen(false)}>Annulla</Button>
                  <Button onClick={handleSave}>Salva e Inizia Audit</Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* SMART AUDIT DIALOG */}
            <Dialog open={smartAuditModalOpen} onOpenChange={setSmartAuditModalOpen}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Crea Audit Intelligente
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Controlli pre-selezionati in base a suggerimenti intelligenti. Puoi deselezionare o aggiungerne altri.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Codice Audit</Label>
                      <Input
                        value={formData.audit_code}
                        onChange={e => setFormData({ ...formData, audit_code: e.target.value })}
                        placeholder="AUD-2024-SMART-01"
                      />
                    </div>
                    <div>
                      <Label>Data Pianificata</Label>
                      <Input
                        type="date"
                        value={formData.planned_date}
                        onChange={e => setFormData({ ...formData, planned_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Auditor</Label>
                    <Input
                      value={formData.auditor_name}
                      onChange={e => setFormData({ ...formData, auditor_name: e.target.value })}
                      placeholder="Nome Cognome"
                    />
                  </div>

                  <div>
                    <Label>Controlli Selezionati ({selectedControls.length})</Label>
                    <div className="border rounded p-4 space-y-2 max-h-64 overflow-y-auto">
                      {selectedControls.map(control => (
                        <div key={control} className="flex items-center gap-2">
                          <Checkbox
                            checked={true}
                            onCheckedChange={(checked) => {
                              if (!checked) {
                                setSelectedControls(prev => prev.filter(c => c !== control));
                              }
                            }}
                          />
                          <span className="text-sm">{control}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setSmartAuditModalOpen(false)}
                    >
                      Annulla
                    </Button>
                    <Button 
                      onClick={async () => {
                        if (!formData.audit_code || !formData.auditor_name || !formData.planned_date) {
                          toast({
                            title: 'Campi Obbligatori',
                            description: 'Compilare codice audit, auditor e data pianificata',
                            variant: 'destructive'
                          });
                          return;
                        }

                        const controlsScope = selectedControls.length > 5
                          ? `${selectedControls.slice(0, 5).join(', ')}... (+${selectedControls.length - 5} altri)`
                          : selectedControls.join(', ');

                        const { data, error } = await supabase
                          .from('internal_audits')
                          .insert({
                            ...formData,
                            organization_id: '00000000-0000-0000-0000-000000000000',
                            audit_scope: `Audit Intelligente: ${controlsScope}`,
                            objective: `Verifica controlli suggeriti dal sistema intelligente:
- ${smartSuggestions.toVerify.length} controlli da verificare
- ${smartSuggestions.highRisks.length} rischi alti
- ${smartSuggestions.ncToVerify.length} NC da verificare efficacia`,
                            audit_type: 'internal',
                            status: 'planned'
                          })
                          .select()
                          .single();

                        if (error) {
                          toast({
                            title: 'Errore',
                            description: error.message,
                            variant: 'destructive'
                          });
                          return;
                        }

                        toast({
                          title: 'Audit Intelligente Creato',
                          description: `${selectedControls.length} controlli selezionati per verifica`
                        });

                        setSmartAuditModalOpen(false);
                        navigate(`/audit-interni/${data.id}`);
                      }}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Crea Audit Intelligente
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="mb-6 p-4 bg-muted/50 rounded-lg space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">Filtri Avanzati</h3>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-8 text-xs gap-1"
                  >
                    <X className="h-3 w-3" />
                    Cancella Filtri
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Search Text */}
                <div className="lg:col-span-2">
                  <Label className="text-xs">Ricerca Ambito/Codice</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cerca per ambito o codice..."
                      value={filters.searchText}
                      onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
                      className="pl-8"
                    />
                  </div>
                </div>

                {/* Auditor Filter */}
                <div>
                  <Label className="text-xs">Auditor</Label>
                  <Select
                    value={filters.auditor}
                    onValueChange={(value) => setFilters({ ...filters, auditor: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tutti" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti gli auditor</SelectItem>
                      {uniqueAuditors.map((auditor) => (
                        <SelectItem key={auditor} value={auditor}>
                          {auditor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Audit Type Filter */}
                <div>
                  <Label className="text-xs">Tipo Audit</Label>
                  <Select
                    value={filters.auditType}
                    onValueChange={(value) => setFilters({ ...filters, auditType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tutti" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti i tipi</SelectItem>
                      <SelectItem value="internal">Interno</SelectItem>
                      <SelectItem value="follow_up">Follow-up</SelectItem>
                      <SelectItem value="special">Speciale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date From */}
                <div>
                  <Label className="text-xs">Data Da</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.dateFrom && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {filters.dateFrom ? format(filters.dateFrom, 'dd/MM/yyyy') : 'Seleziona'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={filters.dateFrom}
                        onSelect={(date) => setFilters({ ...filters, dateFrom: date })}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                     </PopoverContent>
                   </Popover>
                 </div>

                {/* Date To */}
                <div>
                  <Label className="text-xs">Data A</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.dateTo && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {filters.dateTo ? format(filters.dateTo, 'dd/MM/yyyy') : 'Seleziona'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={filters.dateTo}
                        onSelect={(date) => setFilters({ ...filters, dateTo: date })}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Active Filters Display */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {filters.searchText && (
                    <Badge variant="secondary" className="gap-1">
                      Ricerca: {filters.searchText}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => setFilters({ ...filters, searchText: '' })}
                      />
                    </Badge>
                  )}
                  {filters.auditor !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      Auditor: {filters.auditor}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => setFilters({ ...filters, auditor: 'all' })}
                      />
                    </Badge>
                  )}
                  {filters.auditType !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      Tipo: {filters.auditType}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => setFilters({ ...filters, auditType: 'all' })}
                      />
                    </Badge>
                  )}
                  {filters.dateFrom && (
                    <Badge variant="secondary" className="gap-1">
                      Da: {format(filters.dateFrom, 'dd/MM/yyyy')}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => setFilters({ ...filters, dateFrom: undefined })}
                      />
                    </Badge>
                  )}
                  {filters.dateTo && (
                    <Badge variant="secondary" className="gap-1">
                      A: {format(filters.dateTo, 'dd/MM/yyyy')}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => setFilters({ ...filters, dateTo: undefined })}
                      />
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Results Info */}
          {hasActiveFilters && (
            <div className="mb-4 text-sm text-muted-foreground">
              {filteredAudits.length} {filteredAudits.length === 1 ? 'risultato trovato' : 'risultati trovati'}
              {filteredAudits.length !== audits.length && ` di ${audits.length} totali`}
            </div>
          )}

          {filteredAudits.length === 0 ? (
            <div className="text-center py-12">
              {hasActiveFilters ? (
                <>
                  <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">Nessun audit trovato con i filtri selezionati</p>
                  <Button variant="outline" onClick={clearFilters}>
                    Cancella Filtri
                  </Button>
                </>
              ) : (
                <>
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nessun audit pianificato</p>
                </>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codice</TableHead>
                  <TableHead>Data Pianificata</TableHead>
                  <TableHead>Ambito</TableHead>
                  <TableHead>Auditor</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAudits.map(audit => (
                  <TableRow key={audit.id}>
                    <TableCell className="font-medium">{audit.audit_code}</TableCell>
                    <TableCell>
                      {audit.planned_date 
                        ? new Date(audit.planned_date).toLocaleDateString('it-IT')
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={audit.audit_scope}>
                        {audit.audit_scope}
                      </div>
                    </TableCell>
                    <TableCell>{audit.auditor_name}</TableCell>
                    <TableCell>
                      <Badge variant={audit.status === 'planned' ? 'secondary' : 'default'}>
                        {audit.status === 'planned' ? 'Pianificato' : 'In Corso'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/audit-interni/${audit.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(audit.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
