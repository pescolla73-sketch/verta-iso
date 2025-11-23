import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, isPast } from 'date-fns';
import { it } from 'date-fns/locale';

export default function NonConformityPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ncs, setNcs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [stats, setStats] = useState({
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    overdue: 0,
    major: 0,
    minor: 0
  });

  useEffect(() => {
    loadNonConformities();
  }, []);

  const loadNonConformities = async () => {
    try {
      setLoading(true);

      // Get organization
      const { data: org, error: orgError } = await supabase
        .from('organization')
        .select('id')
        .limit(1)
        .maybeSingle();
      
      if (orgError || !org) {
        toast({
          title: "Errore",
          description: "Organizzazione non trovata",
          variant: "destructive"
        });
        return;
      }

      // Load NCs
      const { data: ncsData, error: ncsError } = await supabase
        .from('non_conformities')
        .select('*')
        .eq('organization_id', org.id)
        .order('detected_date', { ascending: false });

      if (ncsError) throw ncsError;

      setNcs(ncsData || []);

      // Calculate stats
      const open = ncsData?.filter(nc => nc.status === 'open').length || 0;
      const inProgress = ncsData?.filter(nc => nc.status === 'in_progress').length || 0;
      const resolved = ncsData?.filter(nc => nc.status === 'resolved').length || 0;
      const closed = ncsData?.filter(nc => nc.status === 'closed').length || 0;
      const overdue = ncsData?.filter(nc => 
        nc.deadline && isPast(new Date(nc.deadline)) && nc.status !== 'closed'
      ).length || 0;
      const major = ncsData?.filter(nc => nc.severity === 'major').length || 0;
      const minor = ncsData?.filter(nc => nc.severity === 'minor').length || 0;

      setStats({ open, inProgress, resolved, closed, overdue, major, minor });

    } catch (error: any) {
      console.error('Error loading NCs:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare le non conformità',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    const configs: Record<string, { variant: any; label: string; icon: any }> = {
      major: { variant: 'destructive', label: 'NC Maggiore', icon: XCircle },
      minor: { variant: 'secondary', label: 'NC Minore', icon: AlertTriangle },
      observation: { variant: 'outline', label: 'Osservazione', icon: AlertTriangle }
    };
    const config = configs[severity] || configs.observation;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { variant: any; label: string }> = {
      open: { variant: 'destructive', label: 'Aperta' },
      in_progress: { variant: 'default', label: 'In Lavorazione' },
      resolved: { variant: 'secondary', label: 'Risolta' },
      closed: { variant: 'outline', label: 'Chiusa' }
    };
    const config = configs[status] || configs.open;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const isOverdue = (deadline: string | null, status: string) => {
    if (!deadline || status === 'closed') return false;
    return isPast(new Date(deadline));
  };

  // Filter NCs
  const filteredNcs = ncs.filter(nc => {
    if (filterStatus !== 'all' && nc.status !== filterStatus) return false;
    if (filterSeverity !== 'all' && nc.severity !== filterSeverity) return false;
    if (showOverdueOnly) {
      if (!nc.deadline || nc.status === 'closed') return false;
      if (new Date(nc.deadline) >= new Date()) return false;
    }
    return true;
  });

  if (loading) {
    return <div className="flex items-center justify-center p-8">Caricamento...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestione Non Conformità</h1>
          <p className="text-muted-foreground">ISO 27001:2022 - Clausola 10.1</p>
        </div>
        <Button onClick={() => navigate('/non-conformity/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Nuova Non Conformità
        </Button>
      </div>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aperte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.open}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Lavorazione
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Risolte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Chiuse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.closed}</div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">
              Scadute
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.overdue}</div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">
              NC Maggiori
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.major}</div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">
              NC Minori
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.minor}</div>
          </CardContent>
        </Card>
      </div>

      {/* NC Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Registro Non Conformità</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli stati</SelectItem>
                  <SelectItem value="open">Aperte</SelectItem>
                  <SelectItem value="in_progress">In Lavorazione</SelectItem>
                  <SelectItem value="resolved">Risolte</SelectItem>
                  <SelectItem value="closed">Chiuse</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Gravità" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte</SelectItem>
                  <SelectItem value="major">NC Maggiori</SelectItem>
                  <SelectItem value="minor">NC Minori</SelectItem>
                  <SelectItem value="observation">Osservazioni</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant={showOverdueOnly ? "destructive" : "outline"}
                size="sm"
                onClick={() => setShowOverdueOnly(!showOverdueOnly)}
              >
                <Clock className="h-4 w-4 mr-1" />
                Scadute
              </Button>
            </div>
          </div>
          {filteredNcs.length !== ncs.length && (
            <p className="text-sm text-muted-foreground mt-2">
              Mostrate {filteredNcs.length} di {ncs.length} NC
            </p>
          )}
        </CardHeader>
        <CardContent>
          {filteredNcs.length === 0 && ncs.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">Nessuna Non Conformità</h3>
              <p className="text-muted-foreground mb-4">
                Ottimo! Non ci sono non conformità registrate.
              </p>
              <Button onClick={() => navigate('/non-conformity/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Registra Prima NC
              </Button>
            </div>
          ) : filteredNcs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nessuna NC trovata con i filtri selezionati
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codice</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Titolo</TableHead>
                  <TableHead>Gravità</TableHead>
                  <TableHead>Controllo</TableHead>
                  <TableHead>Responsabile</TableHead>
                  <TableHead>Scadenza</TableHead>
                  <TableHead>Stato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNcs.map((nc) => (
                  <TableRow
                    key={nc.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/non-conformity/${nc.id}`)}
                  >
                    <TableCell className="font-medium">{nc.nc_code}</TableCell>
                    <TableCell>
                      {nc.detected_date ? format(new Date(nc.detected_date), 'dd MMM yyyy', { locale: it }) : '-'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{nc.title}</TableCell>
                    <TableCell>{getSeverityBadge(nc.severity)}</TableCell>
                    <TableCell>{nc.related_control || '-'}</TableCell>
                    <TableCell>{nc.responsible_person || '-'}</TableCell>
                    <TableCell>
                      {nc.deadline ? (
                        <span className={isOverdue(nc.deadline, nc.status) ? 'text-red-600 font-semibold' : ''}>
                          {format(new Date(nc.deadline), 'dd MMM yyyy', { locale: it })}
                          {isOverdue(nc.deadline, nc.status) && (
                            <Clock className="inline h-3 w-3 ml-1" />
                          )}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(nc.status)}</TableCell>
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
