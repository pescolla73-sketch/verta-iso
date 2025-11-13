import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, FileText, CheckCircle, Plus, ClipboardList } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function InternalAuditPage() {
  const navigate = useNavigate();
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

      // DEMO mode: always get first organization
      console.log('📥 Loading organization...');
      const { data: orgs, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .maybeSingle();
      
      if (orgError) {
        console.error('❌ Organization query error:', orgError);
      }
      
      if (!orgs) {
        console.log('⚠️ No organization found');
        toast({
          title: "Info",
          description: "Nessuna organizzazione disponibile. Configura l'organizzazione dalle Impostazioni.",
        });
        setLoading(false);
        return;
      }
      
      const orgId = orgs.id;
      console.log('✅ Using organization:', orgId);

      // Load audits
      console.log('📥 Loading audits for organization:', orgId);
      const { data: auditsData, error: auditsError } = await supabase
        .from('internal_audits')
        .select('*')
        .eq('organization_id', orgId)
        .order('audit_date', { ascending: false });

      if (auditsError) {
        console.error('❌ Audits query error:', auditsError);
        throw auditsError;
      }

      console.log('✅ Audits loaded:', auditsData?.length || 0);
      setAudits(auditsData || []);

      // Calculate stats
      const total = auditsData?.length || 0;
      const planned = auditsData?.filter(a => a.status === 'planned').length || 0;
      const completed = auditsData?.filter(a => a.status === 'completed').length || 0;
      const conforming = auditsData?.filter(a => 
        a.status === 'completed' && a.overall_result === 'conforming'
      ).length || 0;

      setStats({ total, planned, completed, conforming });

    } catch (error: any) {
      console.error('❌ Error loading audits:', error);
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
    const configs: Record<string, { variant: any; label: string }> = {
      planned: { variant: 'outline', label: 'Pianificato' },
      in_progress: { variant: 'secondary', label: 'In Corso' },
      completed: { variant: 'default', label: 'Completato' }
    };
    const config = configs[status] || configs.planned;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getResultBadge = (result: string | null) => {
    if (!result) return null;
    
    const configs: Record<string, { variant: any; label: string }> = {
      conforming: { variant: 'default', label: 'Conforme' },
      partial: { variant: 'secondary', label: 'Parziale' },
      non_conforming: { variant: 'destructive', label: 'Non Conforme' }
    };
    const config = configs[result] || { variant: 'outline', label: result };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

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
          <h1 className="text-3xl font-bold">Audit Interni</h1>
          <p className="text-muted-foreground mt-1">
            ISO 27001:2022 Clausola 9.2 - Gestione Audit Interni
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/audit-interni/piano')}>
            <Calendar className="h-4 w-4 mr-2" />
            Vai al Piano
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
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Totale Audit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pianificati
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.planned}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completati
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conformi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{stats.conforming}</div>
          </CardContent>
        </Card>
      </div>

      {/* Audits Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registro Audit Interni</CardTitle>
        </CardHeader>
        <CardContent>
          {audits.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nessun audit trovato</h3>
              <p className="text-muted-foreground mb-4">
                Inizia creando il primo audit dal piano annuale
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
                {audits.map((audit) => (
                  <TableRow
                    key={audit.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/audit-interni/esegui/${audit.id}`)}
                  >
                    <TableCell className="font-medium">{audit.audit_code}</TableCell>
                    <TableCell>
                      {format(new Date(audit.audit_date), 'dd MMM yyyy', { locale: it })}
                    </TableCell>
                    <TableCell className="capitalize">{audit.audit_type}</TableCell>
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
                          navigate(`/audit-interni/esegui/${audit.id}`);
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
