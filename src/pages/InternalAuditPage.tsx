import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardCheck, Plus, Calendar, FileCheck, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function InternalAuditPage() {
  const navigate = useNavigate();
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [stats, setStats] = useState({
    total: 0,
    planned: 0,
    completed: 0,
    conforming: 0
  });

  useEffect(() => {
    loadAudits();
  }, []);

  const loadAudits = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('internal_audits')
        .select('*')
        .order('audit_date', { ascending: false });

      if (error) throw error;

      setAudits(data || []);
      
      // Calculate stats
      const total = data?.length || 0;
      const planned = data?.filter(a => a.status === 'planned').length || 0;
      const completed = data?.filter(a => a.status === 'completed').length || 0;
      const conforming = data?.filter(a => a.overall_result === 'conforming').length || 0;
      
      setStats({ total, planned, completed, conforming });
    } catch (error: any) {
      console.error('Error loading audits:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare gli audit',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      planned: { variant: 'secondary', label: 'Pianificato' },
      in_progress: { variant: 'default', label: 'In Corso' },
      completed: { variant: 'outline', label: 'Completato' },
      cancelled: { variant: 'destructive', label: 'Annullato' }
    };
    const config = variants[status] || variants.planned;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getResultBadge = (result: string) => {
    if (!result) return <Badge variant="outline">-</Badge>;
    const variants: Record<string, any> = {
      conforming: { variant: 'default', label: 'Conforme', className: 'bg-green-500' },
      non_conforming: { variant: 'destructive', label: 'Non Conforme' },
      partial: { variant: 'secondary', label: 'Parziale', className: 'bg-orange-500' }
    };
    const config = variants[result] || variants.partial;
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  const filteredAudits = audits.filter(audit => {
    const year = new Date(audit.audit_date).getFullYear().toString();
    const matchYear = filterYear === 'all' || year === filterYear;
    const matchStatus = filterStatus === 'all' || audit.status === filterStatus;
    return matchYear && matchStatus;
  });

  const years = Array.from(new Set(audits.map(a => new Date(a.audit_date).getFullYear().toString())));

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Caricamento audit...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-8 w-8" />
            Audit Interni
          </h1>
          <p className="text-muted-foreground mt-1">Gestione audit interni ISO 27001:2022</p>
        </div>
        <Button onClick={() => navigate('/audit-interni/piano')}>
          <Plus className="mr-2 h-4 w-4" />
          Nuovo Audit
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Audit Totali</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{stats.total}</span>
              <ClipboardCheck className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pianificati</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{stats.planned}</span>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completati</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{stats.completed}</span>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conformi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{stats.conforming}</span>
              <FileCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Elenco Audit</CardTitle>
            <div className="flex gap-2">
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Anno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti</SelectItem>
                  {years.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti</SelectItem>
                  <SelectItem value="planned">Pianificato</SelectItem>
                  <SelectItem value="in_progress">In Corso</SelectItem>
                  <SelectItem value="completed">Completato</SelectItem>
                  <SelectItem value="cancelled">Annullato</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAudits.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nessun audit trovato</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate('/audit-interni/piano')}>
                Pianifica il primo audit
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codice</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ambito</TableHead>
                  <TableHead>Auditor</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Risultato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAudits.map(audit => (
                  <TableRow 
                    key={audit.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/audit-interni/${audit.id}`)}
                  >
                    <TableCell className="font-medium">{audit.audit_code}</TableCell>
                    <TableCell>{new Date(audit.audit_date).toLocaleDateString('it-IT')}</TableCell>
                    <TableCell>{audit.audit_scope}</TableCell>
                    <TableCell>{audit.auditor_name}</TableCell>
                    <TableCell>{getStatusBadge(audit.status)}</TableCell>
                    <TableCell>{getResultBadge(audit.overall_result)}</TableCell>
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
