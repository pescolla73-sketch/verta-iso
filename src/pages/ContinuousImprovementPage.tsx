import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, isPast } from 'date-fns';
import { it } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ContinuousImprovementPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    corrective: 0,
    preventive: 0,
    improvement: 0
  });

  useEffect(() => {
    loadActions();
  }, []);

  const loadActions = async () => {
    try {
      setLoading(true);

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

      const { data: actionsData, error: actionsError } = await supabase
        .from('improvement_actions')
        .select('*')
        .eq('organization_id', org.id)
        .order('created_at', { ascending: false });

      if (actionsError) throw actionsError;

      setActions(actionsData || []);

      // Calculate stats
      const total = actionsData?.length || 0;
      const open = actionsData?.filter(a => a.status === 'open').length || 0;
      const inProgress = actionsData?.filter(a => a.status === 'in_progress').length || 0;
      const completed = actionsData?.filter(a => a.status === 'completed' || a.status === 'verified' || a.status === 'closed').length || 0;
      const overdue = actionsData?.filter(a => 
        a.target_date && isPast(new Date(a.target_date)) && a.status !== 'completed' && a.status !== 'verified' && a.status !== 'closed'
      ).length || 0;
      const corrective = actionsData?.filter(a => a.action_type === 'corrective').length || 0;
      const preventive = actionsData?.filter(a => a.action_type === 'preventive').length || 0;
      const improvement = actionsData?.filter(a => a.action_type === 'improvement').length || 0;

      setStats({ total, open, inProgress, completed, overdue, corrective, preventive, improvement });

    } catch (error: any) {
      console.error('Error loading actions:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare le azioni',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredActions = actions.filter(action => {
    if (filterType !== 'all' && action.action_type !== filterType) return false;
    if (filterStatus !== 'all' && action.status !== filterStatus) return false;
    if (filterPriority !== 'all' && action.priority !== filterPriority) return false;
    return true;
  });

  const getTypeBadge = (type: string) => {
    const configs: Record<string, { variant: any; label: string; icon: any }> = {
      corrective: { variant: 'destructive', label: 'Correttiva', icon: AlertCircle },
      preventive: { variant: 'default', label: 'Preventiva', icon: CheckCircle },
      improvement: { variant: 'secondary', label: 'Miglioramento', icon: TrendingUp }
    };
    const config = configs[type] || configs.improvement;
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
      open: { variant: 'outline', label: 'Aperta' },
      in_progress: { variant: 'default', label: 'In Corso' },
      completed: { variant: 'secondary', label: 'Completata' },
      verified: { variant: 'default', label: 'Verificata' },
      closed: { variant: 'outline', label: 'Chiusa' }
    };
    const config = configs[status] || configs.open;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const configs: Record<string, { variant: any; label: string }> = {
      critical: { variant: 'destructive', label: 'Critica' },
      high: { variant: 'destructive', label: 'Alta' },
      medium: { variant: 'secondary', label: 'Media' },
      low: { variant: 'outline', label: 'Bassa' }
    };
    const config = configs[priority] || configs.medium;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const isOverdue = (targetDate: string | null, status: string) => {
    if (!targetDate || status === 'completed' || status === 'verified' || status === 'closed') return false;
    return isPast(new Date(targetDate));
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Caricamento...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Miglioramento Continuo</h1>
          <p className="text-muted-foreground">ISO 27001:2022 - Clausola 10.2</p>
        </div>
        <Button onClick={() => navigate('/improvement/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Nuova Azione
        </Button>
      </div>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Totali
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aperte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.open}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Corso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">
              Scadute
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">
              Correttive
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.corrective}</div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Preventive
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.preventive}</div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Miglioramenti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.improvement}</div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Registro Azioni</CardTitle>
            
            <div className="flex flex-wrap gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i tipi</SelectItem>
                  <SelectItem value="corrective">Correttive</SelectItem>
                  <SelectItem value="preventive">Preventive</SelectItem>
                  <SelectItem value="improvement">Miglioramenti</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli stati</SelectItem>
                  <SelectItem value="open">Aperte</SelectItem>
                  <SelectItem value="in_progress">In Corso</SelectItem>
                  <SelectItem value="completed">Completate</SelectItem>
                  <SelectItem value="verified">Verificate</SelectItem>
                  <SelectItem value="closed">Chiuse</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Priorità" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte</SelectItem>
                  <SelectItem value="critical">Critica</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="low">Bassa</SelectItem>
                </SelectContent>
              </Select>

              {(filterType !== 'all' || filterStatus !== 'all' || filterPriority !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterType('all');
                    setFilterStatus('all');
                    setFilterPriority('all');
                  }}
                >
                  Reset
                </Button>
              )}
            </div>
          </div>

          {filteredActions.length !== actions.length && (
            <p className="text-sm text-muted-foreground mt-2">
              Mostrate {filteredActions.length} di {actions.length} azioni
            </p>
          )}
        </CardHeader>
        <CardContent>
          {filteredActions.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">Nessuna Azione di Miglioramento</h3>
              <p className="text-muted-foreground mb-4">
                {actions.length === 0 
                  ? "Inizia registrando la prima azione di miglioramento continuo"
                  : "Nessuna azione corrisponde ai filtri selezionati"}
              </p>
              <Button onClick={() => navigate('/improvement/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Crea Prima Azione
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codice</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Titolo</TableHead>
                  <TableHead>Priorità</TableHead>
                  <TableHead>Responsabile</TableHead>
                  <TableHead>Scadenza</TableHead>
                  <TableHead>Stato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActions.map((action) => (
                  <TableRow
                    key={action.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/improvement/${action.id}`)}
                  >
                    <TableCell className="font-medium">{action.action_code}</TableCell>
                    <TableCell>{getTypeBadge(action.action_type)}</TableCell>
                    <TableCell className="max-w-xs truncate">{action.title}</TableCell>
                    <TableCell>{getPriorityBadge(action.priority)}</TableCell>
                    <TableCell>{action.responsible_person || '-'}</TableCell>
                    <TableCell>
                      {action.target_date ? (
                        <span className={isOverdue(action.target_date, action.status) ? 'text-red-600 font-semibold' : ''}>
                          {format(new Date(action.target_date), 'dd MMM yyyy', { locale: it })}
                          {isOverdue(action.target_date, action.status) && (
                            <Clock className="inline h-3 w-3 ml-1" />
                          )}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(action.status)}</TableCell>
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
