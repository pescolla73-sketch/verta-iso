import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileDown, Filter, History } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const AuditTrailPage = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    module: 'all',
    action: 'all',
    dateFrom: '',
    dateTo: '',
    search: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadAuditTrail();
  }, [filters]);

  const loadAuditTrail = async () => {
    setLoading(true);
    
    try {
      // Get organization ID
      const { data: orgData } = await supabase
        .from('organization')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (!orgData) {
        console.warn('⚠️ No organization found');
        setLoading(false);
        return;
      }

      let query = supabase
        .from('audit_trail')
        .select('*')
        .eq('organization_id', orgData.id)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (filters.module !== 'all') {
        query = query.eq('module', filters.module);
      }
      if (filters.action !== 'all') {
        query = query.eq('action', filters.action);
      }
      if (filters.dateFrom) {
        query = query.gte('timestamp', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('timestamp', filters.dateTo);
      }
      if (filters.search) {
        query = query.ilike('entity_name', `%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error loading audit trail:', error);
        toast({
          title: "Errore",
          description: "Impossibile caricare l'audit trail",
          variant: "destructive"
        });
      } else {
        setEntries(data || []);
        console.log('✅ Loaded', data?.length, 'audit trail entries');
      }
    } catch (error) {
      console.error('❌ Exception loading audit trail:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const variants: Record<string, string> = {
      create: 'default',
      update: 'secondary',
      delete: 'destructive',
      approve: 'default',
      verify: 'default',
      close: 'outline'
    };
    return variants[action] || 'outline';
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      create: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
      update: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
      delete: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
      approve: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200',
      verify: 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200',
      close: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
    };
    return colors[action] || 'bg-gray-100 dark:bg-gray-800';
  };

  const exportAuditTrail = () => {
    try {
      const csv = [
        'Timestamp,User,Email,Module,Action,Entity,Description',
        ...entries.map(e => 
          `"${e.timestamp}","${e.user_name}","${e.user_email}","${e.module}","${e.action}","${e.entity_name}","${e.description || ''}"`
        )
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-trail-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Esportazione completata",
        description: `${entries.length} voci esportate`
      });
    } catch (error) {
      console.error('❌ Export error:', error);
      toast({
        title: "Errore",
        description: "Impossibile esportare l'audit trail",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <History className="h-8 w-8" />
            Audit Trail
          </h1>
          <p className="text-muted-foreground">Storico completo delle modifiche al sistema</p>
        </div>
        <Button onClick={exportAuditTrail} variant="outline" disabled={entries.length === 0}>
          <FileDown className="h-4 w-4 mr-2" />
          Esporta CSV
        </Button>
      </div>

      {/* Filtri */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Select value={filters.module} onValueChange={(v) => setFilters({...filters, module: v})}>
              <SelectTrigger>
                <SelectValue placeholder="Modulo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i moduli</SelectItem>
                <SelectItem value="soa">SoA</SelectItem>
                <SelectItem value="risks">Rischi</SelectItem>
                <SelectItem value="policies">Policy</SelectItem>
                <SelectItem value="procedures">Procedure</SelectItem>
                <SelectItem value="audits">Audit</SelectItem>
                <SelectItem value="nc">Non-Conformità</SelectItem>
                <SelectItem value="incidents">Incidenti</SelectItem>
                <SelectItem value="assets">Asset</SelectItem>
                <SelectItem value="training">Formazione</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.action} onValueChange={(v) => setFilters({...filters, action: v})}>
              <SelectTrigger>
                <SelectValue placeholder="Azione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le azioni</SelectItem>
                <SelectItem value="create">Creazione</SelectItem>
                <SelectItem value="update">Modifica</SelectItem>
                <SelectItem value="delete">Eliminazione</SelectItem>
                <SelectItem value="approve">Approvazione</SelectItem>
                <SelectItem value="verify">Verifica</SelectItem>
                <SelectItem value="close">Chiusura</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
              placeholder="Da data"
            />

            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
              placeholder="A data"
            />

            <Input
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              placeholder="Cerca entità..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista entries */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Caricamento...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Nessuna attività trovata</p>
              <p className="text-sm">Le modifiche al sistema verranno registrate qui</p>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div key={entry.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge className={getActionColor(entry.action)}>
                        {entry.action}
                      </Badge>
                      <Badge variant="outline">{entry.module}</Badge>
                      <span className="text-sm font-medium truncate">{entry.entity_name}</span>
                      {entry.triggered_by && entry.triggered_by !== 'manual' && (
                        <Badge variant="secondary" className="text-xs">
                          {entry.triggered_by}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{entry.description}</p>
                    {entry.changes && entry.changes.length > 0 && (
                      <div className="mt-2 p-2 bg-muted/50 rounded text-xs space-y-1">
                        {entry.changes.map((c: any, i: number) => (
                          <div key={i} className="font-mono">
                            <span className="text-muted-foreground">{c.field}:</span>{' '}
                            <span className="line-through text-destructive">{String(c.oldValue)}</span>
                            {' → '}
                            <span className="font-medium text-primary">{String(c.newValue)}</span>
                            {c.reason && (
                              <span className="ml-2 text-muted-foreground italic">({c.reason})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {entry.linked_entity_name && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Collegato a: <span className="font-medium">{entry.linked_entity_name}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right text-xs text-muted-foreground shrink-0">
                    <div className="font-medium">{format(new Date(entry.timestamp), 'dd MMM yyyy', { locale: it })}</div>
                    <div>{format(new Date(entry.timestamp), 'HH:mm:ss')}</div>
                    <div className="mt-1 text-xs">{entry.user_name}</div>
                    <div className="text-xs text-muted-foreground/70">{entry.user_email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditTrailPage;
