import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, CheckCircle, FileText, AlertCircle, Plus, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { updateLinkedModules } from '@/utils/auditLinkage';
import { logAuditTrail } from '@/lib/auditTrail';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function AuditExecutionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [audit, setAudit] = useState<any>(null);
  const [checklist, setChecklist] = useState<any[]>([]);
  const [findings, setFindings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgId, setOrgId] = useState<string>('');
  const [conclusion, setConclusion] = useState('');
  const [overallResult, setOverallResult] = useState<string>('');
  const [autoUpdateModules, setAutoUpdateModules] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [findingModalOpen, setFindingModalOpen] = useState(false);
  const [newFinding, setNewFinding] = useState({
    title: '',
    description: '',
    severity: 'minor',
    control_reference: '',
    recommended_action: ''
  });

  useEffect(() => {
    loadAuditData();
  }, [id]);

  const loadAuditData = async () => {
    try {
      setLoading(true);

      // Organization detection
      const { data: orgData } = await supabase
        .from('organization')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (!orgData) {
        toast({
          title: 'Errore',
          description: 'Organizzazione non trovata',
          variant: 'destructive'
        });
        return;
      }

      const currentOrgId = orgData.id;
      setOrgId(currentOrgId);

      // Load audit
      const { data: auditData, error: auditError } = await supabase
        .from('internal_audits')
        .select('*')
        .eq('id', id)
        .single();

      if (auditError) throw auditError;

      setAudit(auditData);
      setConclusion(auditData.conclusion || '');
      setOverallResult(auditData.overall_result || '');

      // Load checklist
      const { data: checklistData } = await supabase
        .from('audit_checklist_items')
        .select('*')
        .eq('audit_id', id)
        .order('control_reference');

      if (!checklistData || checklistData.length === 0) {
        await autoPopulateChecklist(id!, auditData.audit_scope, currentOrgId);
      } else {
        setChecklist(checklistData);
      }

      // Load findings
      const { data: findingsData } = await supabase
        .from('audit_findings')
        .select('*')
        .eq('audit_id', id);

      setFindings(findingsData || []);

    } catch (error: any) {
      console.error('Error loading audit:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare i dati',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const autoPopulateChecklist = async (auditId: string, scope: string, orgId: string) => {
    const controlRefs = scope.match(/A\.\d+\.\d+/g) || [];
    let itemsToInsert: any[] = [];

    // Try to get items from SoA based on scope
    if (controlRefs.length > 0) {
      const { data: soaItems } = await supabase
        .from('soa_items')
        .select('*')
        .eq('organization_id', orgId)
        .in('control_reference', controlRefs);

      if (soaItems && soaItems.length > 0) {
        itemsToInsert = soaItems.map(item => ({
          audit_id: auditId,
          control_reference: item.control_reference,
          control_title: item.control_title,
          requirement: 'Verificare implementazione controllo',
          evidence_required: 'Documenti, procedure, evidenze operative',
          evidence_found: '',
          audit_notes: '',
          result: null,
          source_type: 'soa',
          pre_audit_status: item.implementation_status,
          update_linked: true,
          auto_create_nc: true
        }));
      }
    }

    // Fallback: If no items found, use base controls
    if (itemsToInsert.length === 0) {
      const baseControls = [
        { ref: 'A.5.1', title: 'Policies for information security' },
        { ref: 'A.5.2', title: 'Information security roles and responsibilities' },
        { ref: 'A.5.15', title: 'Access control' },
        { ref: 'A.8.1', title: 'User endpoint devices' },
        { ref: 'A.8.5', title: 'Secure authentication' },
        { ref: 'A.8.7', title: 'Protection against malware' },
        { ref: 'A.8.8', title: 'Management of technical vulnerabilities' },
        { ref: 'A.8.15', title: 'Logging' },
        { ref: 'A.8.16', title: 'Monitoring activities' },
        { ref: 'A.8.23', title: 'Web filtering' }
      ];

      itemsToInsert = baseControls.map(c => ({
        audit_id: auditId,
        control_reference: c.ref,
        control_title: c.title,
        requirement: 'Verificare implementazione controllo',
        evidence_required: 'Documenti, procedure, evidenze operative',
        evidence_found: '',
        audit_notes: '',
        result: null,
        source_type: 'base',
        update_linked: true,
        auto_create_nc: false
      }));
    }

    if (itemsToInsert.length > 0) {
      const { error } = await supabase.from('audit_checklist_items').insert(itemsToInsert);
      
      if (error) {
        console.error('Error inserting checklist items:', error);
        toast({
          title: 'Errore',
          description: 'Impossibile creare la checklist',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Checklist Creata',
          description: `${itemsToInsert.length} controlli aggiunti alla checklist`
        });
        // Reload to show the new items
        loadAuditData();
      }
    }
  };

  const updateChecklistItem = async (itemId: string, field: string, value: any) => {
    const { error } = await supabase
      .from('audit_checklist_items')
      .update({ [field]: value })
      .eq('id', itemId);

    if (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile salvare',
        variant: 'destructive'
      });
    } else {
      setChecklist(prev =>
        prev.map(item => (item.id === itemId ? { ...item, [field]: value } : item))
      );
    }
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await supabase
        .from('internal_audits')
        .update({
          status: 'in_progress',
          conclusion,
          overall_result: overallResult
        })
        .eq('id', id);

      toast({
        title: 'Bozza Salvata',
        description: 'Progressi salvati con successo'
      });
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile salvare',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteAudit = async () => {
    if (!conclusion || !overallResult) {
      toast({
        title: 'Campi Obbligatori',
        description: 'Inserire conclusione e risultato complessivo',
        variant: 'destructive'
      });
      return;
    }

    // Check if all checklist items have results
    const itemsWithoutResult = checklist.filter(item => !item.result);
    if (itemsWithoutResult.length > 0) {
      const proceed = confirm(
        `Ci sono ${itemsWithoutResult.length} controlli senza risultato. Vuoi completare comunque l'audit?`
      );
      if (!proceed) return;
    }

    setProcessing(true);

    try {
      console.log('🔍 [Audit Complete] Starting...');

      // Prepare update data with safe defaults
      const updateData = {
        status: 'completed', // ← Valid status value
        conclusion: conclusion || '',
        overall_result: overallResult || 'conforming',
        completed_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      };

      console.log('💾 Completing audit with data:', updateData);

      // Update audit status
      const { data, error } = await supabase
        .from('internal_audits')
        .update(updateData)
        .eq('id', id)
        .eq('organization_id', orgId)
        .select();

      if (error) {
        console.error('❌ UPDATE ERROR:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.error('❌ UPDATE returned no data');
        throw new Error('Aggiornamento bloccato');
      }

      console.log('✅ [Audit] Status updated to completed');

      // Log audit completion
      logAuditTrail({
        organizationId: orgId,
        module: 'audits',
        action: 'close',
        entityType: 'audit',
        entityId: id!,
        entityName: audit.audit_code,
        changes: [{
          field: 'status',
          oldValue: audit.status,
          newValue: 'completed'
        }],
        triggeredBy: 'manual',
        description: `Audit ${audit.audit_code} completato con risultato: ${overallResult}`
      });

      // Update linked modules if enabled
      if (autoUpdateModules) {
        console.log('🔗 [Linked Modules] Starting automatic updates...');
        const stats = await updateLinkedModules(id!, audit, checklist);

        toast({
          title: 'Audit Completato con Successo',
          description: `Aggiornati: ${stats.updatedCount} controlli SoA, ${stats.risksUpdated} rischi, ${stats.ncClosed} NC chiuse, ${stats.ncCreated} NC create`,
        });

        console.log('✨ [Complete] All updates successful');
      } else {
        toast({
          title: 'Audit Completato',
          description: 'Salvato senza aggiornamenti automatici'
        });
        
        console.log('ℹ️ [Complete] No automatic updates (disabled by user)');
      }

      // Force page refresh to ensure data is current
      setTimeout(() => {
        window.location.href = '/audit-interni';
      }, 1000);
    } catch (error: any) {
      console.error('❌ [Error] Completing audit:', error);
      toast({
        title: 'Errore',
        description: error.message || 'Impossibile completare l\'audit',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleAddFinding = async () => {
    try {
      await supabase.from('audit_findings').insert({
        ...newFinding,
        audit_id: id,
        organization_id: orgId,
        status: 'open'
      });

      toast({
        title: 'Finding Aggiunto',
        description: 'Nuovo finding creato'
      });

      setFindingModalOpen(false);
      setNewFinding({
        title: '',
        description: '',
        severity: 'minor',
        control_reference: '',
        recommended_action: ''
      });
      loadAuditData();
    } catch (error: any) {
      toast({
        title: 'Errore',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, any> = {
      planned: { variant: 'outline', label: 'Pianificato' },
      in_progress: { variant: 'secondary', label: 'In Corso' },
      completed: { variant: 'default', label: 'Completato' }
    };
    const config = configs[status] || configs.planned;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const stats = {
    total: checklist.length,
    conforming: checklist.filter(i => i.result === 'conforming').length,
    nonConforming: checklist.filter(i => i.result === 'non_conforming').length,
    partial: checklist.filter(i => i.result === 'partial').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Audit non trovato</h3>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/audit-interni')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{audit.audit_code}</h1>
              {getStatusBadge(audit.status)}
            </div>
            <p className="text-sm text-muted-foreground">
              Data: {format(new Date(audit.audit_date), 'dd MMMM yyyy', { locale: it })} |
              Auditor: {audit.auditor_name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={saving || audit.status === 'completed'}
          >
            <Save className="h-4 w-4 mr-2" />
            Salva Bozza
          </Button>
          <Button 
            onClick={handleCompleteAudit} 
            disabled={audit.status === 'completed' || !conclusion || !overallResult}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Completa Audit
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="checklist" className="space-y-4">
        <TabsList>
          <TabsTrigger value="checklist">Checklist ({checklist.length})</TabsTrigger>
          <TabsTrigger value="findings">Findings ({findings.length})</TabsTrigger>
          <TabsTrigger value="conclusion">Conclusioni</TabsTrigger>
        </TabsList>

        {/* Checklist Tab */}
        <TabsContent value="checklist">
          <Card>
            <CardHeader>
              <CardTitle>Checklist Verifica Controlli</CardTitle>
              <CardDescription>
                Compilare evidenze e risultati per ogni controllo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Controllo</TableHead>
                    <TableHead>Titolo</TableHead>
                    <TableHead>Status Pre</TableHead>
                    <TableHead>Evidenze Trovate</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Risultato</TableHead>
                    <TableHead>Aggiorna</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checklist.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge variant="outline">{item.control_reference}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs text-sm">{item.control_title}</TableCell>
                      <TableCell>
                        {item.pre_audit_status && (
                          <Badge 
                            variant={
                              item.pre_audit_status === 'verified' ? 'default' : 
                              item.pre_audit_status === 'implemented' ? 'secondary' : 
                              'outline'
                            }
                          >
                            {item.pre_audit_status}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Textarea
                          value={item.evidence_found || ''}
                          onChange={e =>
                            updateChecklistItem(item.id, 'evidence_found', e.target.value)
                          }
                          placeholder="Evidenze trovate..."
                          className="min-h-16 text-xs"
                          disabled={audit.status === 'completed'}
                        />
                      </TableCell>
                      <TableCell>
                        <Textarea
                          value={item.audit_notes || ''}
                          onChange={e =>
                            updateChecklistItem(item.id, 'audit_notes', e.target.value)
                          }
                          placeholder="Note..."
                          className="min-h-16 text-xs"
                          disabled={audit.status === 'completed'}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={item.result || ''}
                          onValueChange={v => updateChecklistItem(item.id, 'result', v)}
                          disabled={audit.status === 'completed'}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Seleziona" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="conforming">Conforme</SelectItem>
                            <SelectItem value="non_conforming">Non Conforme</SelectItem>
                            <SelectItem value="partial">Parziale</SelectItem>
                            <SelectItem value="not_applicable">N/A</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={item.update_linked !== false}
                          onCheckedChange={checked =>
                            updateChecklistItem(item.id, 'update_linked', checked)
                          }
                          disabled={audit.status === 'completed'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Findings Tab */}
        <TabsContent value="findings">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Findings</CardTitle>
                  <CardDescription>Rilievi identificati durante l'audit</CardDescription>
                </div>
                <Dialog open={findingModalOpen} onOpenChange={setFindingModalOpen}>
                  <DialogTrigger asChild>
                    <Button disabled={audit.status === 'completed'}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuovo Finding
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nuovo Finding</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Titolo</Label>
                        <Input
                          value={newFinding.title}
                          onChange={e =>
                            setNewFinding({ ...newFinding, title: e.target.value })
                          }
                          placeholder="Titolo del finding"
                        />
                      </div>
                      <div>
                        <Label>Descrizione</Label>
                        <Textarea
                          value={newFinding.description}
                          onChange={e =>
                            setNewFinding({ ...newFinding, description: e.target.value })
                          }
                          placeholder="Descrizione dettagliata"
                        />
                      </div>
                      <div>
                        <Label>Severità</Label>
                        <Select
                          value={newFinding.severity}
                          onValueChange={v =>
                            setNewFinding({ ...newFinding, severity: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="minor">Minor</SelectItem>
                            <SelectItem value="major">Major</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Controllo Correlato</Label>
                        <Input
                          value={newFinding.control_reference}
                          onChange={e =>
                            setNewFinding({
                              ...newFinding,
                              control_reference: e.target.value
                            })
                          }
                          placeholder="Es: A.5.1"
                        />
                      </div>
                      <div>
                        <Label>Azione Raccomandata</Label>
                        <Textarea
                          value={newFinding.recommended_action}
                          onChange={e =>
                            setNewFinding({
                              ...newFinding,
                              recommended_action: e.target.value
                            })
                          }
                          placeholder="Azione raccomandata"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setFindingModalOpen(false)}
                        >
                          Annulla
                        </Button>
                        <Button onClick={handleAddFinding}>Aggiungi</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {findings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Nessun finding registrato
                </div>
              ) : (
                <div className="space-y-4">
                  {findings.map(finding => (
                    <Card key={finding.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{finding.title}</CardTitle>
                          <Badge
                            variant={
                              finding.severity === 'major'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {finding.severity}
                          </Badge>
                        </div>
                        {finding.control_reference && (
                          <Badge variant="outline" className="w-fit">
                            {finding.control_reference}
                          </Badge>
                        )}
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {finding.description}
                        </p>
                        {finding.recommended_action && (
                          <div className="mt-2 p-2 bg-muted rounded-md">
                            <p className="text-xs font-medium">Azione Raccomandata:</p>
                            <p className="text-xs text-muted-foreground">
                              {finding.recommended_action}
                            </p>
                          </div>
                        )}
                        <div className="mt-4 flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(
                              `/non-conformity/new?source=audit_internal&sourceId=${audit.id}&control=${encodeURIComponent(finding.control_reference || '')}&title=${encodeURIComponent(finding.title || '')}&description=${encodeURIComponent(finding.description || '')}`
                            )}
                          >
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Crea NC
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conclusion Tab */}
        <TabsContent value="conclusion" className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Verificati</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-green-600">Conformi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.conforming}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-red-600">Non Conformi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {stats.nonConforming}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-orange-600">Parziali</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.partial}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Conclusion */}
          <Card>
            <CardHeader>
              <CardTitle>Conclusione Audit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Conclusione</Label>
                <Textarea
                  value={conclusion}
                  onChange={e => setConclusion(e.target.value)}
                  placeholder="Conclusioni dell'audit"
                  className="min-h-32"
                  disabled={audit.status === 'completed'}
                />
              </div>
              <div>
                <Label>Risultato Complessivo</Label>
                <Select
                  value={overallResult}
                  onValueChange={setOverallResult}
                  disabled={audit.status === 'completed'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona risultato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conforming">Conforme</SelectItem>
                    <SelectItem value="non_conforming">Non Conforme</SelectItem>
                    <SelectItem value="partially_conforming">Parzialmente Conforme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Auto-update checkbox */}
              <div className="flex items-start space-x-2 p-4 border rounded-lg bg-muted/30">
                <Checkbox
                  id="auto-update"
                  checked={autoUpdateModules}
                  onCheckedChange={(checked) => setAutoUpdateModules(checked as boolean)}
                  disabled={audit.status === 'completed'}
                />
                <div className="space-y-1">
                  <label
                    htmlFor="auto-update"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Aggiorna automaticamente moduli collegati
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Al completamento, aggiorna SoA, Rischi e Non-Conformità basandosi sui risultati dell'audit.
                    Controlli conformi saranno verificati, NC correlate chiuse, e rischi ricalcolati.
                  </p>
                </div>
              </div>

              {/* Preview of what will be updated */}
              {autoUpdateModules && checklist.length > 0 && (
                <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Preview Aggiornamenti
                  </h4>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <p>• {checklist.filter(i => i.result === 'conforming' && i.update_linked !== false).length} controlli verranno marcati come VERIFICATI in SoA</p>
                    <p>• {checklist.filter(i => i.result === 'non_conforming').length} nuove NC verranno create</p>
                    <p>• NC esistenti in stato 'verification' verranno chiuse</p>
                    <p>• Rischi correlati ai controlli verificati verranno ricalcolati</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Loading Overlay */}
      {processing && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="w-96">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                Aggiornamento Moduli in Corso...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Aggiornamento di SoA, Rischi, Non-Conformità e controlli ISO 27001.
                Questo potrebbe richiedere alcuni secondi.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
