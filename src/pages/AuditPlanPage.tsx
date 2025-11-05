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
import { Calendar, Plus, AlertTriangle, Trash2, Edit } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function AuditPlanPage() {
  const navigate = useNavigate();
  const [audits, setAudits] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
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
      
      // Load planned audits
      const { data: auditsData, error: auditsError } = await supabase
        .from('internal_audits')
        .select('*')
        .in('status', ['planned', 'in_progress'])
        .order('planned_date', { ascending: true });
      if (auditsError) throw auditsError;

      setAudits(auditsData || []);

      // Load risk-based suggestions
      const { data: risksData } = await supabase
        .from('risks')
        .select('*')
        .gte('inherent_risk_score', 12);

      if (risksData && risksData.length > 0) {
        const controls = new Set<string>();
        risksData.forEach(risk => {
          if (risk.related_controls && Array.isArray(risk.related_controls)) {
            risk.related_controls.forEach((c: string) => controls.add(c));
          }
        });
        
        const suggestionsArray = Array.from(controls).map(control => ({
          control,
          riskCount: risksData.filter(r => 
            r.related_controls && r.related_controls.includes(control)
          ).length
        }));

        setSuggestions(suggestionsArray.slice(0, 10));
      }
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

      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Suggerimenti Intelligenti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Controlli da auditare prioritariamente in base ai rischi elevati:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s, i) => (
                <Badge key={i} variant="secondary">
                  {s.control} ({s.riskCount} rischi)
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
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
