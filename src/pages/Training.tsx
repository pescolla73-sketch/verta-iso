import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Plus, Download, Calendar, Award } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { toast } from 'sonner';

interface TrainingRecord {
  id: string;
  employee_name: string;
  employee_email: string | null;
  role: string | null;
  training_title: string;
  training_type: string;
  training_date: string;
  training_duration_hours: number | null;
  certificate_issued: boolean;
  notes: string | null;
}

export default function Training() {
  const [trainings, setTrainings] = useState<TrainingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    employee_name: '',
    employee_email: '',
    role: '',
    training_title: '',
    training_type: 'security_awareness',
    training_date: '',
    training_duration_hours: '',
    certificate_issued: false,
    notes: ''
  });

  useEffect(() => {
    loadTrainings();
  }, []);

  const loadTrainings = async () => {
    try {
      const { data, error } = await supabase
        .from('training_records')
        .select('*')
        .order('training_date', { ascending: false });

      if (error) throw error;
      setTrainings(data || []);
    } catch (error) {
      console.error('Error loading trainings:', error);
      toast.error('Errore nel caricamento');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('training_records')
        .insert(formData as any);

      if (error) throw error;

      toast.success('✅ Training registrato!');
      setShowAddDialog(false);
      setFormData({
        employee_name: '',
        employee_email: '',
        role: '',
        training_title: '',
        training_type: 'security_awareness',
        training_date: '',
        training_duration_hours: '',
        certificate_issued: false,
        notes: ''
      });
      loadTrainings();
    } catch (error) {
      console.error('Error adding training:', error);
      toast.error('Errore nel salvataggio');
    }
  };

  const exportToCSV = () => {
    const csv = [
      ['Nome', 'Email', 'Ruolo', 'Corso', 'Tipo', 'Data', 'Ore', 'Certificato'].join(','),
      ...trainings.map(t => [
        t.employee_name,
        t.employee_email || '',
        t.role || '',
        t.training_title,
        t.training_type,
        t.training_date,
        t.training_duration_hours || '',
        t.certificate_issued ? 'Sì' : 'No'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `training_records_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast.success('CSV esportato!');
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      security_awareness: 'Security Awareness',
      iso27001: 'ISO 27001',
      gdpr: 'GDPR',
      technical: 'Tecnico',
      other: 'Altro'
    };
    return labels[type] || type;
  };

  const getTypeBadgeVariant = (type: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      security_awareness: 'default',
      iso27001: 'secondary',
      gdpr: 'outline',
      technical: 'secondary',
      other: 'outline'
    };
    return variants[type] || 'outline';
  };

  // Calculate stats
  const stats = {
    total: trainings.length,
    thisYear: trainings.filter(t => 
      new Date(t.training_date).getFullYear() === new Date().getFullYear()
    ).length,
    totalHours: trainings.reduce((sum, t) => sum + (parseFloat(String(t.training_duration_hours)) || 0), 0),
    certified: trainings.filter(t => t.certificate_issued).length
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GraduationCap className="h-8 w-8" />
            Training & Competenze
          </h1>
          <p className="text-muted-foreground mt-1">
            Registro formazione per compliance ISO 27001 (Clause 7.2)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Esporta CSV
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuovo Training
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registra Formazione</DialogTitle>
                <DialogDescription>
                  Aggiungi un record di training completato
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome Dipendente *</Label>
                    <Input
                      required
                      value={formData.employee_name}
                      onChange={(e) => setFormData({...formData, employee_name: e.target.value})}
                      placeholder="Mario Rossi"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.employee_email}
                      onChange={(e) => setFormData({...formData, employee_email: e.target.value})}
                      placeholder="mario.rossi@azienda.it"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Ruolo</Label>
                  <Input
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    placeholder="IT Manager, Developer, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Titolo Corso *</Label>
                  <Input
                    required
                    value={formData.training_title}
                    onChange={(e) => setFormData({...formData, training_title: e.target.value})}
                    placeholder="Corso Security Awareness 2025"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo Formazione *</Label>
                    <Select 
                      value={formData.training_type}
                      onValueChange={(value) => setFormData({...formData, training_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="security_awareness">Security Awareness</SelectItem>
                        <SelectItem value="iso27001">ISO 27001</SelectItem>
                        <SelectItem value="gdpr">GDPR</SelectItem>
                        <SelectItem value="technical">Tecnico</SelectItem>
                        <SelectItem value="other">Altro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Data Corso *</Label>
                    <Input
                      type="date"
                      required
                      value={formData.training_date}
                      onChange={(e) => setFormData({...formData, training_date: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Durata (ore)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={formData.training_duration_hours}
                      onChange={(e) => setFormData({...formData, training_duration_hours: e.target.value})}
                      placeholder="4"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Certificato Rilasciato</Label>
                    <Select 
                      value={formData.certificate_issued ? 'true' : 'false'}
                      onValueChange={(value) => setFormData({...formData, certificate_issued: value === 'true'})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Sì</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Note</Label>
                  <Input
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Note aggiuntive..."
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    Annulla
                  </Button>
                  <Button type="submit">
                    Salva Training
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Training Totali</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Quest'Anno</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.thisYear}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ore Totali</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalHours.toFixed(1)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Con Certificato</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.certified}</div>
          </CardContent>
        </Card>
      </div>

      {/* Training Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registro Training</CardTitle>
          <CardDescription>
            Storico completo della formazione erogata
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Caricamento...</div>
          ) : trainings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nessun training registrato. Aggiungi il primo!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dipendente</TableHead>
                    <TableHead>Ruolo</TableHead>
                    <TableHead>Corso</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ore</TableHead>
                    <TableHead>Certificato</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trainings.map((training) => (
                    <TableRow key={training.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{training.employee_name}</div>
                          {training.employee_email && (
                            <div className="text-xs text-muted-foreground">
                              {training.employee_email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{training.role || '-'}</TableCell>
                      <TableCell className="font-medium">{training.training_title}</TableCell>
                      <TableCell>
                        <Badge variant={getTypeBadgeVariant(training.training_type)}>
                          {getTypeLabel(training.training_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(training.training_date), 'dd/MM/yyyy', { locale: it })}
                        </div>
                      </TableCell>
                      <TableCell>{training.training_duration_hours || '-'}</TableCell>
                      <TableCell>
                        {training.certificate_issued ? (
                          <Award className="h-5 w-5 text-green-500" />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
