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
import { Calendar, Plus, AlertTriangle, Trash2, Edit, Target, Shield, CheckCircle2, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getSmartSuggestions } from '@/utils/auditLinkage';

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
      navigate(`/audit-interni/${data.id}`);
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
                  Implementati ma non ancora verificati (o &gt;1 anno)
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {smartSuggestions.toVerify.slice(0, 5).map((item: any, i: number) => (
                    <div key={i} className="p-2 bg-muted rounded text-xs space-y-1">
                      <div className="font-medium">{item.control_reference} - {item.control_title}</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">Implementato</Badge>
                        {item.implementation_date && (
                          <span className="text-muted-foreground">
                            {Math.floor((Date.now() - new Date(item.implementation_date).getTime()) / (1000 * 60 * 60 * 24))} gg
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
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
                  Rischi con score ≥12 da verificare in audit
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {smartSuggestions.highRisks.slice(0, 5).map((risk: any, i: number) => (
                    <div key={i} className="p-2 bg-muted rounded text-xs space-y-1">
                      <div className="font-medium">{risk.name}</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-xs">Score: {risk.inherent_risk_score}</Badge>
                        {risk.related_controls && (
                          <span className="text-muted-foreground">
                            {risk.related_controls.length} controlli
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
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
                  NC pronte per verifica efficacia
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {smartSuggestions.ncToVerify.slice(0, 5).map((nc: any, i: number) => (
                    <div key={i} className="p-2 bg-muted rounded text-xs space-y-1">
                      <div className="font-medium">{nc.title}</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{nc.severity}</Badge>
                        {nc.related_control && (
                          <span className="text-muted-foreground">{nc.related_control}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* SMART AUDIT BUTTON */}
      {(smartSuggestions.toVerify.length > 0 || smartSuggestions.highRisks.length > 0 || smartSuggestions.ncToVerify.length > 0) && (
        <div className="flex justify-center">
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
              setSmartAuditModalOpen(true);
            }}
            className="gap-2"
          >
            <Sparkles className="h-5 w-5" />
            Crea Audit Intelligente
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Audit Pianificati</CardTitle>
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
                        const { data, error } = await supabase
                          .from('internal_audits')
                          .insert({
                            ...formData,
                            organization_id: '00000000-0000-0000-0000-000000000000',
                            audit_scope: `Audit intelligente: ${selectedControls.length} controlli`,
                            objective: 'Verifica controlli suggeriti dal sistema intelligente',
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
                          title: 'Successo',
                          description: 'Audit intelligente creato'
                        });

                        setSmartAuditModalOpen(false);
                        navigate(`/audit-interni/${data.id}`);
                      }}
                    >
                      Crea Audit
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {audits.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nessun audit pianificato</p>
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
                {audits.map(audit => (
                  <TableRow key={audit.id}>
                    <TableCell className="font-medium">{audit.audit_code}</TableCell>
                    <TableCell>
                      {audit.planned_date 
                        ? new Date(audit.planned_date).toLocaleDateString('it-IT')
                        : '-'
                      }
                    </TableCell>
                    <TableCell>{audit.audit_scope}</TableCell>
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
