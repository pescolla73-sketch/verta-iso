import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, CheckCircle, FileText, AlertCircle, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { updateLinkedModules } from '@/utils/auditLinkage';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AuditExecutionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [audit, setAudit] = useState<any>(null);
  const [checklist, setChecklist] = useState<any[]>([]);
  const [findings, setFindings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [conclusion, setConclusion] = useState('');
  const [overallResult, setOverallResult] = useState<string>('');

  useEffect(() => {
    loadAuditData();
  }, [id]);

  const loadAuditData = async () => {
    try {
      setLoading(true);

      // Get organization ID (demo mode - use first org)
      const orgData = await supabase.from('organization').select('id').limit(1).single();
      const currentOrgId = orgData.data?.id;
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
    } catch (error) {
      console.error('Error loading audit data:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare i dati dell\'audit',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const autoPopulateChecklist = async (auditId: string, scope: string, orgId: string) => {
    const controlRefs = scope.match(/A\.\d+\.\d+/g) || [];

    if (controlRefs.length > 0) {
      const { data: soaItems } = await supabase
        .from('soa_items')
        .select('*')
        .eq('organization_id', orgId)
        .in('control_reference', controlRefs);

      if (soaItems && soaItems.length > 0) {
        const items = soaItems.map(item => ({
          audit_id: auditId,
          control_reference: item.control_reference,
          control_title: item.control_title,
          requirement: 'Verificare implementazione controllo',
          evidence_requested: 'Documenti, procedure, evidenze operative',
          evidence_found: '',
          audit_notes: '',
          result: null,
          source_type: 'soa',
          pre_audit_status: item.implementation_status,
          update_linked: true,
          auto_create_nc: true
        }));

        await supabase.from('audit_checklist_items').insert(items);
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
        description: 'Impossibile salvare la modifica',
        variant: 'destructive'
      });
    } else {
      setChecklist(prev => 
        prev.map(item => item.id === itemId ? { ...item, [field]: value } : item)
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
        description: 'Impossibile salvare la bozza',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteAudit = async () => {
    if (!conclusion || !overallResult) {
      toast({
        title: 'Campi Mancanti',
        description: 'Compilare conclusione e risultato complessivo',
        variant: 'destructive'
      });
      return;
    }

    setCompleting(true);
    try {
      // Update audit status
      await supabase
        .from('internal_audits')
        .update({
          status: 'completed',
          conclusion,
          overall_result: overallResult
        })
        .eq('id', id);

      // Execute cross-module updates
      await updateLinkedModules(id!, audit, checklist);

      toast({
        title: 'Audit Completato',
        description: 'Moduli aggiornati automaticamente'
      });

      navigate('/audit-interni');
    } catch (error) {
      console.error('Error completing audit:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile completare l\'audit',
        variant: 'destructive'
      });
    } finally {
      setCompleting(false);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.text('Report Audit Interno', 14, 20);
    doc.setFontSize(11);
    doc.text(`Codice: ${audit.audit_code}`, 14, 30);
    doc.text(`Data: ${format(new Date(audit.audit_date), 'dd/MM/yyyy')}`, 14, 36);
    doc.text(`Auditor: ${audit.auditor_name}`, 14, 42);

    // Checklist table
    const checklistRows = checklist.map(item => [
      item.control_reference,
      item.control_title,
      item.result || 'N/A',
      item.audit_notes || ''
    ]);

    autoTable(doc, {
      startY: 50,
      head: [['Controllo', 'Titolo', 'Risultato', 'Note']],
      body: checklistRows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 66, 66] }
    });

    // Conclusion
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text('Conclusione:', 14, finalY);
    doc.setFontSize(10);
    const conclusionLines = doc.splitTextToSize(conclusion, 180);
    doc.text(conclusionLines, 14, finalY + 6);

    doc.save(`Audit_${audit.audit_code}.pdf`);

    toast({
      title: 'PDF Esportato',
      description: 'Report salvato con successo'
    });
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

  const getResultBadge = (result: string | null) => {
    if (!result) return <Badge variant="outline">Da Verificare</Badge>;
    
    const configs: Record<string, any> = {
      conforming: { variant: 'default', label: 'Conforme' },
      non_conforming: { variant: 'destructive', label: 'Non Conforme' },
      partial: { variant: 'secondary', label: 'Parziale' },
      not_applicable: { variant: 'outline', label: 'N/A' }
    };
    
    const config = configs[result] || { variant: 'outline', label: result };
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
              Auditor: {audit.auditor_name} | 
              Auditee: {audit.auditee_name || 'N/A'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Ambito: {audit.audit_scope}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportPDF} disabled={audit.status === 'planned'}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={handleSaveDraft} disabled={saving || audit.status === 'completed'}>
            <Save className="h-4 w-4 mr-2" />
            Salva Bozza
          </Button>
          <Button 
            onClick={handleCompleteAudit} 
            disabled={completing || audit.status === 'completed'}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Completa Audit
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="checklist" className="space-y-4">
        <TabsList>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="findings">Findings ({findings.length})</TabsTrigger>
          <TabsTrigger value="conclusion">Conclusioni</TabsTrigger>
        </TabsList>

        {/* Checklist Tab */}
        <TabsContent value="checklist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Checklist Verifica Controlli</CardTitle>
              <CardDescription>
                Compilare evidenze e risultati per ogni controllo verificato
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Controllo</TableHead>
                    <TableHead className="w-48">Titolo</TableHead>
                    <TableHead className="w-32">Evidenze Richieste</TableHead>
                    <TableHead className="w-32">Evidenze Trovate</TableHead>
                    <TableHead className="w-32">Note</TableHead>
                    <TableHead className="w-32">Risultato</TableHead>
                    <TableHead className="w-20">Agg.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checklist.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge variant="outline">{item.control_reference}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{item.control_title}</TableCell>
                      <TableCell>
                        <Textarea
                          value={item.evidence_requested || ''}
                          onChange={(e) => updateChecklistItem(item.id, 'evidence_requested', e.target.value)}
                          placeholder="Evidenze da verificare..."
                          className="min-h-16 text-xs"
                          disabled={audit.status === 'completed'}
                        />
                      </TableCell>
                      <TableCell>
                        <Textarea
                          value={item.evidence_found || ''}
                          onChange={(e) => updateChecklistItem(item.id, 'evidence_found', e.target.value)}
                          placeholder="Evidenze trovate..."
                          className="min-h-16 text-xs"
                          disabled={audit.status === 'completed'}
                        />
                      </TableCell>
                      <TableCell>
                        <Textarea
                          value={item.audit_notes || ''}
                          onChange={(e) => updateChecklistItem(item.id, 'audit_notes', e.target.value)}
                          placeholder="Note audit..."
                          className="min-h-16 text-xs"
                          disabled={audit.status === 'completed'}
                        />
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={item.result || ''} 
                          onValueChange={(v) => updateChecklistItem(item.id, 'result', v)}
                          disabled={audit.status === 'completed'}
                        >
                          <SelectTrigger>
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
                          checked={item.update_linked}
                          onCheckedChange={(checked) => 
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
              <CardTitle>Findings</CardTitle>
              <CardDescription>Rilievi identificati durante l'audit</CardDescription>
            </CardHeader>
            <CardContent>
              {findings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Nessun finding registrato
                </div>
              ) : (
                <div className="space-y-4">
                  {findings.map((finding) => (
                    <Card key={finding.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{finding.title}</CardTitle>
                          <Badge variant={finding.severity === 'major' ? 'destructive' : 'secondary'}>
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
                        <p className="text-sm text-muted-foreground">{finding.description}</p>
                        {finding.recommended_action && (
                          <div className="mt-2 p-2 bg-muted rounded-md">
                            <p className="text-xs font-medium">Azione Raccomandata:</p>
                            <p className="text-xs text-muted-foreground">{finding.recommended_action}</p>
                          </div>
                        )}
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
                <CardTitle className="text-sm font-medium">Verificati</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-600">Conformi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.conforming}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-600">Non Conformi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.nonConforming}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-orange-600">Parziali</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.partial}</div>
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
                <label className="text-sm font-medium mb-2 block">Risultato Complessivo</label>
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
                    <SelectItem value="partial">Parzialmente Conforme</SelectItem>
                    <SelectItem value="non_conforming">Non Conforme</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Conclusione Dettagliata</label>
                <Textarea
                  value={conclusion}
                  onChange={(e) => setConclusion(e.target.value)}
                  placeholder="Inserire conclusioni dell'audit, punti di forza, aree di miglioramento..."
                  className="min-h-32"
                  disabled={audit.status === 'completed'}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
