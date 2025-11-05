import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ClipboardCheck, Save, FileDown, Plus, AlertTriangle, Link2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { updateLinkedModules } from '@/utils/auditLinkage';

// ISO 27001:2022 Annex A Controls
const ISO_CONTROLS = [
  { ref: 'A.5.1', title: 'Policies for information security', requirement: 'Define and approve information security policies' },
  { ref: 'A.5.2', title: 'Information security roles and responsibilities', requirement: 'Allocate information security responsibilities' },
  { ref: 'A.5.3', title: 'Segregation of duties', requirement: 'Segregate incompatible duties' },
  { ref: 'A.5.4', title: 'Management responsibilities', requirement: 'Management requires personnel to apply security' },
  { ref: 'A.5.5', title: 'Contact with authorities', requirement: 'Maintain contact with relevant authorities' },
  { ref: 'A.5.6', title: 'Contact with special interest groups', requirement: 'Maintain contact with special interest groups' },
  { ref: 'A.5.7', title: 'Threat intelligence', requirement: 'Collect and analyze threat intelligence' },
  { ref: 'A.5.8', title: 'Information security in project management', requirement: 'Integrate information security in project management' },
  { ref: 'A.5.9', title: 'Inventory of information and other associated assets', requirement: 'Maintain inventory of assets' },
  { ref: 'A.5.10', title: 'Acceptable use of information and other associated assets', requirement: 'Define acceptable use rules' },
  { ref: 'A.5.11', title: 'Return of assets', requirement: 'Personnel return all assets upon termination' },
  { ref: 'A.5.12', title: 'Classification of information', requirement: 'Classify information according to its importance' },
  { ref: 'A.5.13', title: 'Labelling of information', requirement: 'Label information according to classification' },
  { ref: 'A.5.14', title: 'Information transfer', requirement: 'Control information transfer' },
  { ref: 'A.5.15', title: 'Access control', requirement: 'Control physical and logical access' },
  { ref: 'A.5.16', title: 'Identity management', requirement: 'Manage identities' },
  { ref: 'A.5.17', title: 'Authentication information', requirement: 'Manage authentication information' },
  { ref: 'A.5.18', title: 'Access rights', requirement: 'Grant access rights according to policy' },
  { ref: 'A.5.19', title: 'Information security in supplier relationships', requirement: 'Address security in supplier agreements' },
  { ref: 'A.5.20', title: 'Addressing information security within supplier agreements', requirement: 'Include security requirements in supplier agreements' },
  { ref: 'A.5.21', title: 'Managing information security in the ICT supply chain', requirement: 'Manage security in ICT supply chain' },
  { ref: 'A.5.22', title: 'Monitoring, review and change management of supplier services', requirement: 'Monitor supplier services' },
  { ref: 'A.5.23', title: 'Information security for use of cloud services', requirement: 'Address security in cloud usage' },
  { ref: 'A.5.24', title: 'Information security incident management planning and preparation', requirement: 'Plan and prepare for incident management' },
  { ref: 'A.5.25', title: 'Assessment and decision on information security events', requirement: 'Assess and decide on security events' },
  { ref: 'A.5.26', title: 'Response to information security incidents', requirement: 'Respond to security incidents' },
  { ref: 'A.5.27', title: 'Learning from information security incidents', requirement: 'Learn from security incidents' },
  { ref: 'A.5.28', title: 'Collection of evidence', requirement: 'Collect evidence for incidents' },
  { ref: 'A.5.29', title: 'Information security during disruption', requirement: 'Maintain security during disruption' },
  { ref: 'A.5.30', title: 'ICT readiness for business continuity', requirement: 'Ensure ICT readiness for continuity' },
  { ref: 'A.5.31', title: 'Legal, statutory, regulatory and contractual requirements', requirement: 'Identify legal requirements' },
  { ref: 'A.5.32', title: 'Intellectual property rights', requirement: 'Protect intellectual property' },
  { ref: 'A.5.33', title: 'Protection of records', requirement: 'Protect records' },
  { ref: 'A.5.34', title: 'Privacy and protection of PII', requirement: 'Protect privacy and PII' },
  { ref: 'A.5.35', title: 'Independent review of information security', requirement: 'Conduct independent reviews' },
  { ref: 'A.5.36', title: 'Compliance with policies, rules and standards for information security', requirement: 'Verify compliance' },
  { ref: 'A.5.37', title: 'Documented operating procedures', requirement: 'Document operating procedures' },
  { ref: 'A.6.1', title: 'Screening', requirement: 'Screen personnel before employment' },
  { ref: 'A.6.2', title: 'Terms and conditions of employment', requirement: 'Include security in employment terms' },
  { ref: 'A.6.3', title: 'Information security awareness, education and training', requirement: 'Provide security training' },
  { ref: 'A.6.4', title: 'Disciplinary process', requirement: 'Establish disciplinary process for violations' },
  { ref: 'A.6.5', title: 'Responsibilities after termination or change of employment', requirement: 'Define post-employment responsibilities' },
  { ref: 'A.6.6', title: 'Confidentiality or non-disclosure agreements', requirement: 'Implement confidentiality agreements' },
  { ref: 'A.6.7', title: 'Remote working', requirement: 'Secure remote working' },
  { ref: 'A.6.8', title: 'Information security event reporting', requirement: 'Report security events' },
  { ref: 'A.7.1', title: 'Physical security perimeters', requirement: 'Define and protect physical perimeters' },
  { ref: 'A.7.2', title: 'Physical entry', requirement: 'Control physical entry' },
  { ref: 'A.7.3', title: 'Securing offices, rooms and facilities', requirement: 'Secure work areas' },
  { ref: 'A.7.4', title: 'Physical security monitoring', requirement: 'Monitor physical security' },
  { ref: 'A.7.5', title: 'Protecting against physical and environmental threats', requirement: 'Protect against physical threats' },
  { ref: 'A.7.6', title: 'Working in secure areas', requirement: 'Control work in secure areas' },
  { ref: 'A.7.7', title: 'Clear desk and clear screen', requirement: 'Implement clear desk policy' },
  { ref: 'A.7.8', title: 'Equipment siting and protection', requirement: 'Site and protect equipment' },
  { ref: 'A.7.9', title: 'Security of assets off-premises', requirement: 'Secure off-premises assets' },
  { ref: 'A.7.10', title: 'Storage media', requirement: 'Manage storage media' },
  { ref: 'A.7.11', title: 'Supporting utilities', requirement: 'Protect supporting utilities' },
  { ref: 'A.7.12', title: 'Cabling security', requirement: 'Protect cabling' },
  { ref: 'A.7.13', title: 'Equipment maintenance', requirement: 'Maintain equipment' },
  { ref: 'A.7.14', title: 'Secure disposal or re-use of equipment', requirement: 'Securely dispose of equipment' },
  { ref: 'A.8.1', title: 'User endpoint devices', requirement: 'Protect user endpoint devices' },
  { ref: 'A.8.2', title: 'Privileged access rights', requirement: 'Manage privileged access' },
  { ref: 'A.8.3', title: 'Information access restriction', requirement: 'Restrict information access' },
  { ref: 'A.8.4', title: 'Access to source code', requirement: 'Control access to source code' },
  { ref: 'A.8.5', title: 'Secure authentication', requirement: 'Implement secure authentication' },
  { ref: 'A.8.6', title: 'Capacity management', requirement: 'Manage capacity' },
  { ref: 'A.8.7', title: 'Protection against malware', requirement: 'Protect against malware' },
  { ref: 'A.8.8', title: 'Management of technical vulnerabilities', requirement: 'Manage technical vulnerabilities' },
  { ref: 'A.8.9', title: 'Configuration management', requirement: 'Manage system configurations' },
  { ref: 'A.8.10', title: 'Information deletion', requirement: 'Delete information when no longer needed' },
  { ref: 'A.8.11', title: 'Data masking', requirement: 'Mask data when appropriate' },
  { ref: 'A.8.12', title: 'Data leakage prevention', requirement: 'Prevent data leakage' },
  { ref: 'A.8.13', title: 'Information backup', requirement: 'Backup information' },
  { ref: 'A.8.14', title: 'Redundancy of information processing facilities', requirement: 'Ensure redundancy' },
  { ref: 'A.8.15', title: 'Logging', requirement: 'Log events' },
  { ref: 'A.8.16', title: 'Monitoring activities', requirement: 'Monitor activities' },
  { ref: 'A.8.17', title: 'Clock synchronization', requirement: 'Synchronize clocks' },
  { ref: 'A.8.18', title: 'Use of privileged utility programs', requirement: 'Control privileged utilities' },
  { ref: 'A.8.19', title: 'Installation of software on operational systems', requirement: 'Control software installation' },
  { ref: 'A.8.20', title: 'Networks security', requirement: 'Secure networks' },
  { ref: 'A.8.21', title: 'Security of network services', requirement: 'Secure network services' },
  { ref: 'A.8.22', title: 'Segregation of networks', requirement: 'Segregate networks' },
  { ref: 'A.8.23', title: 'Web filtering', requirement: 'Filter web access' },
  { ref: 'A.8.24', title: 'Use of cryptography', requirement: 'Use cryptography appropriately' },
  { ref: 'A.8.25', title: 'Secure development life cycle', requirement: 'Implement secure SDLC' },
  { ref: 'A.8.26', title: 'Application security requirements', requirement: 'Define application security requirements' },
  { ref: 'A.8.27', title: 'Secure system architecture and engineering principles', requirement: 'Apply secure architecture' },
  { ref: 'A.8.28', title: 'Secure coding', requirement: 'Apply secure coding practices' },
  { ref: 'A.8.29', title: 'Security testing in development and acceptance', requirement: 'Test security in development' },
  { ref: 'A.8.30', title: 'Outsourced development', requirement: 'Control outsourced development' },
  { ref: 'A.8.31', title: 'Separation of development, test and production environments', requirement: 'Separate environments' },
  { ref: 'A.8.32', title: 'Change management', requirement: 'Manage changes' },
  { ref: 'A.8.33', title: 'Test information', requirement: 'Protect test information' },
  { ref: 'A.8.34', title: 'Protection of information systems during audit testing', requirement: 'Protect systems during audit' }
];

export default function AuditExecutionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [audit, setAudit] = useState<any>(null);
  const [checklist, setChecklist] = useState<any[]>([]);
  const [findings, setFindings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [findingModalOpen, setFindingModalOpen] = useState(false);
  const [findingForm, setFindingForm] = useState({
    title: '',
    description: '',
    severity: 'minor',
    control_reference: '',
    recommended_action: '',
    status: 'open'
  });

  useEffect(() => {
    loadAudit();
  }, [id]);

  const loadAudit = async () => {
    try {
      setLoading(true);

      // Load audit
      const { data: auditData, error: auditError } = await supabase
        .from('internal_audits')
        .select('*')
        .eq('id', id)
        .single();

      if (auditError) throw auditError;
      setAudit(auditData);

      // Load checklist
      const { data: checklistData } = await supabase
        .from('audit_checklist_items')
        .select('*')
        .eq('audit_id', id)
        .order('control_reference');

      if (!checklistData || checklistData.length === 0) {
        // Pre-populate with ISO controls
        const items = ISO_CONTROLS.map(c => ({
          audit_id: id,
          control_reference: c.ref,
          control_title: c.title,
          requirement: c.requirement,
          evidence_found: '',
          audit_notes: '',
          result: null
        }));

        const { data: insertedData, error: insertError } = await supabase
          .from('audit_checklist_items')
          .insert(items)
          .select();

        if (!insertError && insertedData) {
          setChecklist(insertedData);
        }
      } else {
        setChecklist(checklistData);
      }

      // Load findings
      const { data: findingsData } = await supabase
        .from('audit_findings')
        .select('*')
        .eq('audit_id', id)
        .order('created_at', { ascending: false });

      setFindings(findingsData || []);

    } catch (error: any) {
      console.error('Error loading audit:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare l\'audit',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateChecklistItem = async (itemId: string, field: string, value: any) => {
    try {
      const { error } = await supabase
        .from('audit_checklist_items')
        .update({ [field]: value })
        .eq('id', itemId);

      if (error) throw error;

      setChecklist(prev => prev.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      ));
    } catch (error: any) {
      console.error('Error updating item:', error);
    }
  };

  const handleSaveAudit = async () => {
    try {
      const { error } = await supabase
        .from('internal_audits')
        .update({
          conclusion: audit.conclusion,
          overall_result: audit.overall_result
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Successo',
        description: 'Audit salvato'
      });
    } catch (error: any) {
      toast({
        title: 'Errore',
        description: 'Errore nel salvataggio',
        variant: 'destructive'
      });
    }
  };

  const handleCompleteAudit = async () => {
    if (!confirm('Completare l\'audit e aggiornare i moduli collegati (SoA, Risks, NC)?')) return;

    try {
      setLoading(true);

      // Call updateLinkedModules to update SoA, risks, controls, NC
      console.log('🔍 [Audit Complete] Starting linked modules update...');
      await updateLinkedModules(id!, audit, checklist);

      // Update audit status
      const { error } = await supabase
        .from('internal_audits')
        .update({ status: 'completed' })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Successo',
        description: 'Audit completato e moduli aggiornati'
      });

      navigate('/audit-interni');
    } catch (error: any) {
      console.error('Error completing audit:', error);
      toast({
        title: 'Errore',
        description: 'Errore nel completamento',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddFinding = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let organizationId = audit?.organization_id;

      const { error } = await supabase
        .from('audit_findings')
        .insert({
          ...findingForm,
          audit_id: id,
          organization_id: organizationId
        });

      if (error) throw error;

      toast({
        title: 'Successo',
        description: 'Finding aggiunto'
      });

      setFindingModalOpen(false);
      setFindingForm({
        title: '',
        description: '',
        severity: 'minor',
        control_reference: '',
        recommended_action: '',
        status: 'open'
      });

      loadAudit();
    } catch (error: any) {
      toast({
        title: 'Errore',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const createNonConformity = async (finding: any) => {
    try {
      const { error } = await supabase
        .from('non_conformities')
        .insert({
          organization_id: audit.organization_id,
          nc_code: `NC-${Date.now()}`,
          title: finding.title,
          description: finding.description,
          source: 'audit',
          source_id: finding.id,
          severity: finding.severity,
          status: 'open'
        });

      if (error) throw error;

      toast({
        title: 'Successo',
        description: 'Non-conformità creata'
      });
    } catch (error: any) {
      toast({
        title: 'Errore',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Report Audit Interno', 14, 20);

    doc.setFontSize(12);
    doc.text(`Codice: ${audit.audit_code}`, 14, 30);
    doc.text(`Ambito: ${audit.audit_scope}`, 14, 37);
    doc.text(`Auditor: ${audit.auditor_name}`, 14, 44);

    // Checklist summary
    const conforming = checklist.filter(c => c.result === 'conforming').length;
    const nonConforming = checklist.filter(c => c.result === 'non_conforming').length;

    autoTable(doc, {
      startY: 55,
      head: [['Riepilogo Checklist', 'Valore']],
      body: [
        ['Controlli Conformi', conforming.toString()],
        ['Non Conformi', nonConforming.toString()],
        ['Totale', checklist.length.toString()]
      ]
    });

    // Findings
    if (findings.length > 0) {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['Finding', 'Severità', 'Controllo']],
        body: findings.map(f => [f.title, f.severity, f.control_reference || '-'])
      });
    }

    doc.save(`audit-${audit.audit_code}.pdf`);
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, any> = {
      critical: { variant: 'destructive', label: 'Critico' },
      major: { variant: 'destructive', label: 'Maggiore', className: 'bg-orange-500' },
      minor: { variant: 'secondary', label: 'Minore', className: 'bg-yellow-500' },
      observation: { variant: 'outline', label: 'Osservazione' }
    };
    const config = variants[severity] || variants.observation;
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-center text-muted-foreground">Audit non trovato</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-8 w-8" />
            {audit.audit_code}
          </h1>
          <p className="text-muted-foreground mt-1">{audit.audit_scope}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportPDF}>
            <FileDown className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button onClick={handleSaveAudit}>
            <Save className="mr-2 h-4 w-4" />
            Salva
          </Button>
        </div>
      </div>

      <Tabs defaultValue="checklist">
        <TabsList>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="findings">Findings</TabsTrigger>
          <TabsTrigger value="conclusions">Conclusioni</TabsTrigger>
        </TabsList>

        <TabsContent value="checklist" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Checklist ISO 27001:2022 Annex A</CardTitle>
                <Button onClick={handleCompleteAudit} size="lg" className="gap-2">
                  <Link2 className="h-4 w-4" />
                  Completa Audit e Aggiorna Moduli
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {checklist.map(item => (
                  <Card key={item.id} className="p-4">
                    <div className="grid gap-4">
                      <div>
                        <p className="font-semibold">{item.control_reference} - {item.control_title}</p>
                        <p className="text-sm text-muted-foreground">{item.requirement}</p>
                      </div>
                      
                      {/* Status Pre-Audit and Source */}
                      <div className="grid grid-cols-2 gap-2 p-2 bg-muted rounded">
                        <div className="text-xs">
                          <span className="font-medium">Status Pre-Audit:</span>{' '}
                          <Badge variant="outline" className="text-xs">
                            {item.pre_audit_status || 'N/A'}
                          </Badge>
                        </div>
                        <div className="text-xs">
                          <span className="font-medium">Fonte:</span>{' '}
                          <Badge variant="secondary" className="text-xs">
                            {item.source_type || 'Manuale'}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Evidenze Richieste</Label>
                          <Textarea
                            value={item.evidence_required || ''}
                            onChange={e => updateChecklistItem(item.id, 'evidence_required', e.target.value)}
                            placeholder="Policy, procedure, log, screenshot..."
                            rows={2}
                          />
                        </div>
                        <div>
                          <Label>Evidenze Trovate</Label>
                          <Textarea
                            value={item.evidence_found || ''}
                            onChange={e => updateChecklistItem(item.id, 'evidence_found', e.target.value)}
                            placeholder="Descrivere le evidenze effettivamente riscontrate"
                            rows={2}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Note Audit</Label>
                        <Textarea
                          value={item.audit_notes || ''}
                          onChange={e => updateChecklistItem(item.id, 'audit_notes', e.target.value)}
                          placeholder="Note aggiuntive, osservazioni, raccomandazioni"
                          rows={2}
                        />
                      </div>
                      
                      <div>
                        <Label>Risultato</Label>
                        <Select
                          value={item.result || ''}
                          onValueChange={v => updateChecklistItem(item.id, 'result', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona risultato" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="conforming">✅ Conforme</SelectItem>
                            <SelectItem value="non_conforming">❌ Non Conforme</SelectItem>
                            <SelectItem value="partial">⚠️ Parzialmente Conforme</SelectItem>
                            <SelectItem value="not_applicable">➖ Non Applicabile</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Checkboxes for automatic updates */}
                      <div className="flex gap-4 p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={item.update_linked !== false}
                            onCheckedChange={(checked) => 
                              updateChecklistItem(item.id, 'update_linked', checked)
                            }
                          />
                          <Label className="text-sm cursor-pointer">
                            Aggiorna moduli collegati (SoA, Risks, Controls)
                          </Label>
                        </div>
                        {item.result === 'non_conforming' && (
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={item.auto_create_nc !== false}
                              onCheckedChange={(checked) => 
                                updateChecklistItem(item.id, 'auto_create_nc', checked)
                              }
                            />
                            <Label className="text-sm cursor-pointer">
                              Crea NC automatica
                            </Label>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="findings" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Findings</CardTitle>
                <Dialog open={findingModalOpen} onOpenChange={setFindingModalOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
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
                          value={findingForm.title}
                          onChange={e => setFindingForm({ ...findingForm, title: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Descrizione</Label>
                        <Textarea
                          value={findingForm.description}
                          onChange={e => setFindingForm({ ...findingForm, description: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Severità</Label>
                          <Select
                            value={findingForm.severity}
                            onValueChange={v => setFindingForm({ ...findingForm, severity: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="critical">Critico</SelectItem>
                              <SelectItem value="major">Maggiore</SelectItem>
                              <SelectItem value="minor">Minore</SelectItem>
                              <SelectItem value="observation">Osservazione</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Controllo</Label>
                          <Input
                            value={findingForm.control_reference}
                            onChange={e => setFindingForm({ ...findingForm, control_reference: e.target.value })}
                            placeholder="Es: A.8.1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Azione Raccomandata</Label>
                        <Textarea
                          value={findingForm.recommended_action}
                          onChange={e => setFindingForm({ ...findingForm, recommended_action: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" onClick={() => setFindingModalOpen(false)}>Annulla</Button>
                      <Button onClick={handleAddFinding}>Salva</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {findings.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nessun finding</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titolo</TableHead>
                      <TableHead>Severità</TableHead>
                      <TableHead>Controllo</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead>Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {findings.map(finding => (
                      <TableRow key={finding.id}>
                        <TableCell className="font-medium">{finding.title}</TableCell>
                        <TableCell>{getSeverityBadge(finding.severity)}</TableCell>
                        <TableCell>{finding.control_reference || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={finding.status === 'open' ? 'secondary' : 'outline'}>
                            {finding.status === 'open' ? 'Aperto' : 'Chiuso'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(finding.severity === 'critical' || finding.severity === 'major') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => createNonConformity(finding)}
                            >
                              Crea NC
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conclusions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conclusioni Audit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Conclusione Audit</Label>
                <Textarea
                  value={audit.conclusion || ''}
                  onChange={e => setAudit({ ...audit, conclusion: e.target.value })}
                  placeholder="Descrivere le conclusioni dell'audit"
                  rows={6}
                />
              </div>
              <div>
                <Label>Risultato Complessivo</Label>
                <Select
                  value={audit.overall_result || ''}
                  onValueChange={v => setAudit({ ...audit, overall_result: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona risultato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conforming">Conforme</SelectItem>
                    <SelectItem value="non_conforming">Non Conforme</SelectItem>
                    <SelectItem value="partial">Parzialmente Conforme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCompleteAudit} className="w-full">
                Completa Audit
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
