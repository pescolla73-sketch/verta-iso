import { useState, useEffect } from 'react';
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
import { Award, Plus, Calendar, CheckCircle, XCircle, AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function CertificationAuditPage() {
  const [audits, setAudits] = useState<any[]>([]);
  const [findings, setFindings] = useState<any[]>([]);
  const [nonConformities, setNonConformities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [findingModalOpen, setFindingModalOpen] = useState(false);
  const [auditForm, setAuditForm] = useState({
    audit_type: 'stage1',
    audit_date: '',
    certifier_name: '',
    outcome: 'pass',
    notes: '',
    report_url: ''
  });
  const [findingForm, setFindingForm] = useState({
    certification_audit_id: '',
    title: '',
    description: '',
    severity: 'minor',
    required_action: '',
    status: 'open',
    linked_nc_id: 'none'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load certification audits
      const { data: auditsData, error: auditsError } = await supabase
        .from('certification_audits')
        .select('*')
        .order('audit_date', { ascending: false });
      if (auditsError) throw auditsError;
      setAudits(auditsData || []);

      // Load certifier findings
      const { data: findingsData } = await supabase
        .from('certifier_findings')
        .select('*, certification_audits(*)')
        .order('created_at', { ascending: false });
      
      setFindings(findingsData || []);

      // Load non-conformities for linking
      const { data: ncData } = await supabase
        .from('non_conformities')
        .select('*')
        .order('created_at', { ascending: false });
      setNonConformities(ncData || []);

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

  const handleSaveAudit = async () => {
    try {
      const { error } = await supabase
        .from('certification_audits')
        .insert({
          ...auditForm,
          organization_id: '00000000-0000-0000-0000-000000000000'
        });

      if (error) throw error;

      toast({
        title: 'Successo',
        description: 'Relazione certificatore salvata'
      });

      setAuditModalOpen(false);
      setAuditForm({
        audit_type: 'stage1',
        audit_date: '',
        certifier_name: '',
        outcome: 'pass',
        notes: '',
        report_url: ''
      });

      loadData();
    } catch (error: any) {
      toast({
        title: 'Errore',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleSaveFinding = async () => {
    try {
      const { error } = await supabase
        .from('certifier_findings')
        .insert({
          ...findingForm,
          organization_id: '00000000-0000-0000-0000-000000000000',
          linked_nc_id: findingForm.linked_nc_id === 'none' ? null : findingForm.linked_nc_id
        });

      if (error) throw error;

      toast({
        title: 'Successo',
        description: 'NC certificatore aggiunta'
      });

      setFindingModalOpen(false);
      setFindingForm({
        certification_audit_id: '',
        title: '',
        description: '',
        severity: 'minor',
        required_action: '',
        status: 'open',
        linked_nc_id: 'none'
      });

      loadData();
    } catch (error: any) {
      toast({
        title: 'Errore',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleDeleteAudit = async (id: string) => {
    if (!confirm('Eliminare questa relazione?')) return;

    try {
      const { error } = await supabase
        .from('certification_audits')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Successo',
        description: 'Relazione eliminata'
      });

      loadData();
    } catch (error: any) {
      toast({
        title: 'Errore',
        description: 'Impossibile eliminare',
        variant: 'destructive'
      });
    }
  };

  const getOutcomeBadge = (outcome: string) => {
    const variants: Record<string, any> = {
      pass: { variant: 'default', label: 'Superato', icon: CheckCircle, className: 'bg-green-500' },
      pass_with_conditions: { variant: 'secondary', label: 'Con Condizioni', icon: AlertTriangle, className: 'bg-orange-500' },
      fail: { variant: 'destructive', label: 'Non Superato', icon: XCircle }
    };
    const config = variants[outcome] || variants.pass;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, any> = {
      major: { variant: 'destructive', label: 'Maggiore' },
      minor: { variant: 'secondary', label: 'Minore', className: 'bg-yellow-500' },
      observation: { variant: 'outline', label: 'Osservazione' }
    };
    const config = variants[severity] || variants.observation;
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  const getAuditTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      stage1: 'Stage 1',
      stage2: 'Stage 2',
      surveillance: 'Sorveglianza',
      recertification: 'Ricertificazione'
    };
    return labels[type] || type;
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Award className="h-8 w-8" />
          Audit Certificazione & Relazioni
        </h1>
        <p className="text-muted-foreground mt-1">Gestione audit di certificazione ISO 27001</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Timeline Certificazione</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {['stage1', 'stage2', 'surveillance', 'surveillance', 'recertification'].map((type, idx) => {
              const audit = audits.find(a => a.audit_type === type);
              const isCompleted = !!audit;
              
              return (
                <Card key={idx} className={isCompleted ? 'border-green-500' : 'border-muted'}>
                  <CardContent className="pt-4 text-center">
                    {isCompleted ? (
                      <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                    ) : (
                      <Calendar className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    )}
                    <p className="font-medium">{getAuditTypeLabel(type)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {audit ? new Date(audit.audit_date).toLocaleDateString('it-IT') : 'Non pianificato'}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Relazioni Certificatore</CardTitle>
            <Dialog open={auditModalOpen} onOpenChange={setAuditModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Carica Nuova Relazione
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nuova Relazione Certificatore</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo Audit</Label>
                      <Select
                        value={auditForm.audit_type}
                        onValueChange={v => setAuditForm({ ...auditForm, audit_type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="stage1">Stage 1</SelectItem>
                          <SelectItem value="stage2">Stage 2</SelectItem>
                          <SelectItem value="surveillance">Sorveglianza</SelectItem>
                          <SelectItem value="recertification">Ricertificazione</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Data Audit</Label>
                      <Input
                        type="date"
                        value={auditForm.audit_date}
                        onChange={e => setAuditForm({ ...auditForm, audit_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Certificatore</Label>
                    <Input
                      value={auditForm.certifier_name}
                      onChange={e => setAuditForm({ ...auditForm, certifier_name: e.target.value })}
                      placeholder="Nome certificatore"
                    />
                  </div>
                  <div>
                    <Label>Esito</Label>
                    <Select
                      value={auditForm.outcome}
                      onValueChange={v => setAuditForm({ ...auditForm, outcome: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pass">Superato</SelectItem>
                        <SelectItem value="pass_with_conditions">Superato con Condizioni</SelectItem>
                        <SelectItem value="fail">Non Superato</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>URL Report (opzionale)</Label>
                    <Input
                      value={auditForm.report_url}
                      onChange={e => setAuditForm({ ...auditForm, report_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label>Note</Label>
                    <Textarea
                      value={auditForm.notes}
                      onChange={e => setAuditForm({ ...auditForm, notes: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setAuditModalOpen(false)}>Annulla</Button>
                  <Button onClick={handleSaveAudit}>Salva</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {audits.length === 0 ? (
            <div className="text-center py-12">
              <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nessuna relazione caricata</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Certificatore</TableHead>
                  <TableHead>Esito</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audits.map(audit => (
                  <TableRow key={audit.id}>
                    <TableCell>{new Date(audit.audit_date).toLocaleDateString('it-IT')}</TableCell>
                    <TableCell>{getAuditTypeLabel(audit.audit_type)}</TableCell>
                    <TableCell>{audit.certifier_name}</TableCell>
                    <TableCell>{getOutcomeBadge(audit.outcome)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteAudit(audit.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>NC da Certificatore</CardTitle>
            <Dialog open={findingModalOpen} onOpenChange={setFindingModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuova NC Certificatore
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nuova NC Certificatore</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Audit Riferimento</Label>
                    <Select
                      value={findingForm.certification_audit_id}
                      onValueChange={v => setFindingForm({ ...findingForm, certification_audit_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona audit" />
                      </SelectTrigger>
                      <SelectContent>
                        {audits.map(audit => (
                          <SelectItem key={audit.id} value={audit.id}>
                            {getAuditTypeLabel(audit.audit_type)} - {new Date(audit.audit_date).toLocaleDateString('it-IT')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                        <SelectItem value="major">Maggiore</SelectItem>
                        <SelectItem value="minor">Minore</SelectItem>
                        <SelectItem value="observation">Osservazione</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Azione Richiesta</Label>
                    <Textarea
                      value={findingForm.required_action}
                      onChange={e => setFindingForm({ ...findingForm, required_action: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Collega NC Interna (opzionale)</Label>
                    <Select
                      value={findingForm.linked_nc_id}
                      onValueChange={v => setFindingForm({ ...findingForm, linked_nc_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Nessuna" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nessuna</SelectItem>
                        {nonConformities.map(nc => (
                          <SelectItem key={nc.id} value={nc.id}>
                            {nc.nc_code} - {nc.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setFindingModalOpen(false)}>Annulla</Button>
                  <Button onClick={handleSaveFinding}>Salva</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {findings.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nessuna NC da certificatore</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Audit</TableHead>
                  <TableHead>Titolo</TableHead>
                  <TableHead>Severità</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>NC Collegata</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {findings.map(finding => {
                  const linkedNc = nonConformities.find(nc => nc.id === finding.linked_nc_id);
                  return (
                    <TableRow key={finding.id}>
                      <TableCell>
                        {finding.certification_audits ? getAuditTypeLabel(finding.certification_audits.audit_type) : '-'}
                      </TableCell>
                      <TableCell className="font-medium">{finding.title}</TableCell>
                      <TableCell>{getSeverityBadge(finding.severity)}</TableCell>
                      <TableCell>
                        <Badge variant={finding.status === 'open' ? 'secondary' : 'outline'}>
                          {finding.status === 'open' ? 'Aperto' : 'Chiuso'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {linkedNc ? (
                          <Badge variant="outline">{linkedNc.nc_code}</Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
