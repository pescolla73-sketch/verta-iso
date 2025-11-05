import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, Calendar, FileText, CheckCircle, XCircle, Clock, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function InternalAuditPage() {
  const navigate = useNavigate();
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [resultFilter, setResultFilter] = useState<string>('all');
  const [orgId, setOrgId] = useState<string | null>(null);

  const [stats, setStats] = useState({
    total: 0,
    planned: 0,
    completed: 0,
    conforming: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get organization ID (demo mode - use first org)
      const orgData = await supabase.from('organization').select('id').limit(1).single();
      if (orgData.data) {
        setOrgId(orgData.data.id);
        await loadAudits(orgData.data.id);
      }
    } catch (error) {
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

  const loadAudits = async (orgId: string) => {
    const { data, error } = await supabase
      .from('internal_audits')
      .select('*')
      .eq('organization_id', orgId)
      .order('audit_date', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading audits:', error);
      return;
    }

    setAudits(data || []);

    // Calculate stats
    const total = data?.length || 0;
    const planned = data?.filter(a => a.status === 'planned').length || 0;
    const completed = data?.filter(a => a.status === 'completed').length || 0;
    const conforming = data?.filter(a => a.status === 'completed' && a.overall_result === 'conforming').length || 0;

    setStats({ total, planned, completed, conforming });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon: any }> = {
      planned: { variant: 'outline', label: 'Pianificato', icon: Calendar },
      in_progress: { variant: 'default', label: 'In Corso', icon: Clock },
      completed: { variant: 'default', label: 'Completato', icon: CheckCircle }
    };

    const config = variants[status] || variants.planned;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getResultBadge = (result: string | null) => {
    if (!result) return null;

    const variants: Record<string, { variant: any; label: string }> = {
      conforming: { variant: 'default', label: 'Conforme' },
      non_conforming: { variant: 'destructive', label: 'Non Conforme' },
      partial: { variant: 'secondary', label: 'Parzialmente Conforme' }
    };

    const config = variants[result] || { variant: 'outline', label: result };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredAudits = audits.filter(audit => {
    const yearMatch = yearFilter === 'all' || 
      new Date(audit.audit_date).getFullYear().toString() === yearFilter;
    const statusMatch = statusFilter === 'all' || audit.status === statusFilter;
    const resultMatch = resultFilter === 'all' || audit.overall_result === resultFilter;

    return yearMatch && statusMatch && resultMatch;
  });

  const availableYears = Array.from(
    new Set(audits.map(a => new Date(a.audit_date).getFullYear()))
  ).sort((a, b) => b - a);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Interni ISO 27001:2022</h1>
          <p className="text-muted-foreground mt-1">Clausola 9.2 - Audit Interni del Sistema di Gestione</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/audit-interni/piano')}>
            <Calendar className="h-4 w-4 mr-2" />
            Piano Audit
          </Button>
          <Button onClick={() => navigate('/audit-interni/piano')}>
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Audit
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Totale Audit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pianificati</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.planned}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completati</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conformi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{stats.conforming}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Registro Audit Interni</CardTitle>
              <CardDescription>Cronologia completa degli audit eseguiti</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Anno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli anni</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti</SelectItem>
                  <SelectItem value="planned">Pianificati</SelectItem>
                  <SelectItem value="in_progress">In Corso</SelectItem>
                  <SelectItem value="completed">Completati</SelectItem>
                </SelectContent>
              </Select>

              <Select value={resultFilter} onValueChange={setResultFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Risultato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti</SelectItem>
                  <SelectItem value="conforming">Conforme</SelectItem>
                  <SelectItem value="partial">Parziale</SelectItem>
                  <SelectItem value="non_conforming">Non Conforme</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAudits.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nessun audit trovato</h3>
              <p className="text-muted-foreground mb-4">
                Inizia creando il piano audit annuale
              </p>
              <Button onClick={() => navigate('/audit-interni/piano')}>
                <Calendar className="h-4 w-4 mr-2" />
                Vai al Piano Audit
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codice</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Ambito</TableHead>
                  <TableHead>Auditor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Risultato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAudits.map((audit) => (
                  <TableRow 
                    key={audit.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/audit-interni/${audit.id}`)}
                  >
                    <TableCell className="font-medium">{audit.audit_code}</TableCell>
                    <TableCell>
                      {format(new Date(audit.audit_date), 'dd MMM yyyy', { locale: it })}
                    </TableCell>
                    <TableCell>{audit.audit_type}</TableCell>
                    <TableCell className="max-w-xs truncate">{audit.audit_scope}</TableCell>
                    <TableCell>{audit.auditor_name}</TableCell>
                    <TableCell>{getStatusBadge(audit.status)}</TableCell>
                    <TableCell>{getResultBadge(audit.overall_result)}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/audit-interni/${audit.id}`);
                        }}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
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
